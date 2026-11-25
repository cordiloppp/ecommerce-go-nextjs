// Package cart implementa el carrito de compra de cada usuario.
package cart

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"ecommerce/internal/db"
	"ecommerce/internal/platform/httpx"
)

// Service contiene la lógica del carrito.
type Service struct {
	q *db.Queries
}

// NewService crea el servicio de carrito.
func NewService(q *db.Queries) *Service {
	return &Service{q: q}
}

// ItemView es la línea de carrito enriquecida con datos del producto.
type ItemView struct {
	ID                uuid.UUID `json:"id"`
	ProductID         uuid.UUID `json:"product_id"`
	Slug              string    `json:"slug"`
	Name              string    `json:"name"`
	ImageURL          string    `json:"image_url"`
	UnitPriceCents    int64     `json:"unit_price_cents"`
	Quantity          int32     `json:"quantity"`
	LineTotalCents    int64     `json:"line_total_cents"`
	Stock             int32     `json:"stock"`
	CurrentPriceCents int64     `json:"current_price_cents"`
}

// View es la representación completa del carrito.
type View struct {
	ID            uuid.UUID  `json:"id"`
	Items         []ItemView `json:"items"`
	SubtotalCents int64      `json:"subtotal_cents"`
	Currency      string     `json:"currency"`
}

// getOrCreate devuelve el carrito del usuario, creándolo si no existe.
func (s *Service) getOrCreate(ctx context.Context, userID uuid.UUID) (db.Cart, error) {
	return s.q.CreateCart(ctx, userID)
}

// View construye la vista del carrito del usuario.
func (s *Service) View(ctx context.Context, userID uuid.UUID) (View, error) {
	c, err := s.getOrCreate(ctx, userID)
	if err != nil {
		return View{}, err
	}
	return s.buildView(ctx, c.ID)
}

func (s *Service) buildView(ctx context.Context, cartID uuid.UUID) (View, error) {
	rows, err := s.q.ListCartItems(ctx, cartID)
	if err != nil {
		return View{}, err
	}

	v := View{ID: cartID, Items: make([]ItemView, 0, len(rows)), Currency: "MXN"}
	for _, it := range rows {
		line := it.UnitPriceCents * int64(it.Quantity)
		v.SubtotalCents += line
		v.Items = append(v.Items, ItemView{
			ID:                it.ID,
			ProductID:         it.ProductID,
			Slug:              it.ProductSlug,
			Name:              it.ProductName,
			ImageURL:          it.ProductImageUrl,
			UnitPriceCents:    it.UnitPriceCents,
			Quantity:          it.Quantity,
			LineTotalCents:    line,
			Stock:             it.ProductStock,
			CurrentPriceCents: it.ProductPriceCents,
		})
	}
	return v, nil
}

// AddItem añade un producto al carrito, congelando su precio actual.
func (s *Service) AddItem(ctx context.Context, userID, productID uuid.UUID, qty int32) (View, error) {
	if qty <= 0 {
		return View{}, httpx.BadRequest("invalid_quantity", "la cantidad debe ser mayor que 0")
	}

	c, err := s.getOrCreate(ctx, userID)
	if err != nil {
		return View{}, err
	}

	p, err := s.q.GetProductByID(ctx, productID)
	if errors.Is(err, pgx.ErrNoRows) {
		return View{}, httpx.NotFound("product_not_found", "producto no encontrado")
	} else if err != nil {
		return View{}, err
	}
	if !p.IsActive {
		return View{}, httpx.BadRequest("product_inactive", "el producto no está disponible")
	}

	// Cantidad ya presente en el carrito para este producto.
	rows, err := s.q.ListCartItems(ctx, c.ID)
	if err != nil {
		return View{}, err
	}
	existing := int32(0)
	for _, it := range rows {
		if it.ProductID == productID {
			existing = it.Quantity
			break
		}
	}
	if existing+qty > p.Stock {
		return View{}, httpx.Conflict("insufficient_stock", "no hay stock suficiente para ese producto")
	}

	if _, err := s.q.UpsertCartItem(ctx, db.UpsertCartItemParams{
		CartID:         c.ID,
		ProductID:      productID,
		Quantity:       qty,
		UnitPriceCents: p.PriceCents,
	}); err != nil {
		return View{}, err
	}

	return s.buildView(ctx, c.ID)
}

// UpdateItem fija la cantidad de una línea del carrito.
func (s *Service) UpdateItem(ctx context.Context, userID, itemID uuid.UUID, qty int32) (View, error) {
	if qty <= 0 {
		return View{}, httpx.BadRequest("invalid_quantity", "la cantidad debe ser mayor que 0")
	}

	c, err := s.getOrCreate(ctx, userID)
	if err != nil {
		return View{}, err
	}

	item, err := s.q.GetCartItemByID(ctx, db.GetCartItemByIDParams{ID: itemID, CartID: c.ID})
	if errors.Is(err, pgx.ErrNoRows) {
		return View{}, httpx.NotFound("item_not_found", "línea de carrito no encontrada")
	} else if err != nil {
		return View{}, err
	}

	p, err := s.q.GetProductByID(ctx, item.ProductID)
	if err != nil {
		return View{}, err
	}
	if qty > p.Stock {
		return View{}, httpx.Conflict("insufficient_stock", "no hay stock suficiente para ese producto")
	}

	if _, err := s.q.UpdateCartItemQuantity(ctx, db.UpdateCartItemQuantityParams{
		ID:       itemID,
		CartID:   c.ID,
		Quantity: qty,
	}); err != nil {
		return View{}, err
	}

	return s.buildView(ctx, c.ID)
}

// RemoveItem elimina una línea del carrito.
func (s *Service) RemoveItem(ctx context.Context, userID, itemID uuid.UUID) (View, error) {
	c, err := s.getOrCreate(ctx, userID)
	if err != nil {
		return View{}, err
	}
	if err := s.q.DeleteCartItem(ctx, db.DeleteCartItemParams{ID: itemID, CartID: c.ID}); err != nil {
		return View{}, err
	}
	return s.buildView(ctx, c.ID)
}

// Clear vacía el carrito del usuario.
func (s *Service) Clear(ctx context.Context, userID uuid.UUID) error {
	c, err := s.getOrCreate(ctx, userID)
	if err != nil {
		return err
	}
	return s.q.ClearCart(ctx, c.ID)
}
