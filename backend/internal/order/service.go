// Package order implementa el checkout (creación de pedido con pago simulado).
package order

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecommerce/internal/db"
	"ecommerce/internal/discount"
	"ecommerce/internal/platform/httpx"
)

// Service orquesta el checkout dentro de una transacción.
type Service struct {
	pool *pgxpool.Pool
	q    *db.Queries
}

// NewService crea el servicio de pedidos.
func NewService(pool *pgxpool.Pool, q *db.Queries) *Service {
	return &Service{pool: pool, q: q}
}

// Result es el pedido creado junto con sus líneas.
type Result struct {
	Order db.Order      `json:"order"`
	Items []db.OrderItem `json:"items"`
}

// Checkout crea un pedido a partir del carrito del usuario, aplicando el cupón
// opcional. Todo ocurre en una transacción: revalida stock con bloqueo, canjea
// el cupón, descuenta stock, simula el pago (status=paid) y vacía el carrito.
func (s *Service) Checkout(ctx context.Context, userID uuid.UUID, code string) (Result, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Result{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := s.q.WithTx(tx)

	cart, err := qtx.GetCartByUserID(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Result{}, httpx.BadRequest("empty_cart", "el carrito está vacío")
	} else if err != nil {
		return Result{}, err
	}

	items, err := qtx.ListCartItems(ctx, cart.ID)
	if err != nil {
		return Result{}, err
	}
	if len(items) == 0 {
		return Result{}, httpx.BadRequest("empty_cart", "el carrito está vacío")
	}

	// Revalida stock con bloqueo de fila y calcula el subtotal con el precio
	// congelado en el carrito.
	var subtotal int64
	for _, it := range items {
		p, err := qtx.GetProductForUpdate(ctx, it.ProductID)
		if errors.Is(err, pgx.ErrNoRows) {
			return Result{}, httpx.Conflict("product_unavailable", "un producto del carrito ya no existe")
		} else if err != nil {
			return Result{}, err
		}
		if !p.IsActive {
			return Result{}, httpx.Conflict("product_inactive", "el producto '"+p.Name+"' ya no está disponible")
		}
		if p.Stock < it.Quantity {
			return Result{}, httpx.Conflict("insufficient_stock", "no hay stock suficiente para '"+p.Name+"'")
		}
		subtotal += it.UnitPriceCents * int64(it.Quantity)
	}

	// Aplica y canjea el cupón (si lo hay) de forma atómica.
	var discountCents int64
	var couponCode *string
	if code = discount.NormalizeCode(code); code != "" {
		d, err := qtx.GetDiscountByCode(ctx, code)
		if errors.Is(err, pgx.ErrNoRows) {
			return Result{}, httpx.NotFound("coupon_not_found", "código de descuento no encontrado")
		} else if err != nil {
			return Result{}, err
		}

		discountCents, err = discount.Evaluate(discount.ToCoupon(d), subtotal, time.Now())
		if err != nil {
			return Result{}, discount.MapDomainError(err)
		}

		// Incremento atómico con guarda de is_active y max_uses.
		if _, err := qtx.RedeemDiscount(ctx, d.ID); errors.Is(err, pgx.ErrNoRows) {
			return Result{}, httpx.Conflict("coupon_max_uses", "el cupón ya no está disponible")
		} else if err != nil {
			return Result{}, err
		}
		couponCode = &d.Code
	}

	total := subtotal - discountCents
	if total < 0 {
		total = 0
	}

	order, err := qtx.CreateOrder(ctx, db.CreateOrderParams{
		UserID:        userID,
		SubtotalCents: subtotal,
		DiscountCents: discountCents,
		TotalCents:    total,
		DiscountCode:  couponCode,
		Status:        "paid", // pago simulado: éxito inmediato
	})
	if err != nil {
		return Result{}, err
	}

	orderItems := make([]db.OrderItem, 0, len(items))
	for _, it := range items {
		oi, err := qtx.CreateOrderItem(ctx, db.CreateOrderItemParams{
			OrderID:        order.ID,
			ProductID:      it.ProductID,
			ProductName:    it.ProductName,
			Quantity:       it.Quantity,
			UnitPriceCents: it.UnitPriceCents,
		})
		if err != nil {
			return Result{}, err
		}
		orderItems = append(orderItems, oi)

		// Descuenta stock con guarda; si falla, otra compra se adelantó.
		if _, err := qtx.DecrementStock(ctx, db.DecrementStockParams{
			Qty: it.Quantity,
			ID:  it.ProductID,
		}); errors.Is(err, pgx.ErrNoRows) {
			return Result{}, httpx.Conflict("insufficient_stock", "no hay stock suficiente para '"+it.ProductName+"'")
		} else if err != nil {
			return Result{}, err
		}
	}

	if err := qtx.ClearCart(ctx, cart.ID); err != nil {
		return Result{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Result{}, err
	}

	return Result{Order: order, Items: orderItems}, nil
}

// Get devuelve un pedido del usuario con sus líneas.
func (s *Service) Get(ctx context.Context, userID, orderID uuid.UUID) (Result, error) {
	o, err := s.q.GetOrderByID(ctx, db.GetOrderByIDParams{ID: orderID, UserID: userID})
	if errors.Is(err, pgx.ErrNoRows) {
		return Result{}, httpx.NotFound("order_not_found", "pedido no encontrado")
	} else if err != nil {
		return Result{}, err
	}
	items, err := s.q.ListOrderItems(ctx, orderID)
	if err != nil {
		return Result{}, err
	}
	return Result{Order: o, Items: items}, nil
}

// List devuelve los pedidos del usuario (sin líneas).
func (s *Service) List(ctx context.Context, userID uuid.UUID) ([]db.Order, error) {
	return s.q.ListOrdersByUser(ctx, userID)
}
