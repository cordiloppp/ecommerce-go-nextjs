package discount

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"ecommerce/internal/db"
	"ecommerce/internal/platform/database"
	"ecommerce/internal/platform/httpx"
)

// Service gestiona cupones de descuento sobre la base de datos.
type Service struct {
	q *db.Queries
}

// NewService crea el servicio de descuentos.
func NewService(q *db.Queries) *Service {
	return &Service{q: q}
}

// ToCoupon convierte un registro de BD en el modelo de dominio Coupon.
func ToCoupon(d db.DiscountCode) Coupon {
	return Coupon{
		Code:             d.Code,
		Type:             d.Type,
		Value:            d.Value,
		MinSubtotalCents: d.MinSubtotalCents,
		MaxUses:          d.MaxUses,
		UsedCount:        d.UsedCount,
		StartsAt:         d.StartsAt,
		ExpiresAt:        d.ExpiresAt,
		IsActive:         d.IsActive,
	}
}

// Validate busca el cupón, lo evalúa contra el subtotal y devuelve el registro
// y el descuento aplicable en céntimos. No incrementa el contador de usos.
func (s *Service) Validate(ctx context.Context, code string, subtotalCents int64) (db.DiscountCode, int64, error) {
	code = NormalizeCode(code)
	d, err := s.q.GetDiscountByCode(ctx, code)
	if errors.Is(err, pgx.ErrNoRows) {
		return db.DiscountCode{}, 0, httpx.NotFound("coupon_not_found", "código de descuento no encontrado")
	} else if err != nil {
		return db.DiscountCode{}, 0, err
	}

	discount, err := Evaluate(ToCoupon(d), subtotalCents, time.Now())
	if err != nil {
		return db.DiscountCode{}, 0, MapDomainError(err)
	}
	return d, discount, nil
}

// MapDomainError traduce un error de dominio de cupón en un *APIError HTTP.
func MapDomainError(err error) error {
	switch {
	case errors.Is(err, ErrInactive):
		return httpx.BadRequest("coupon_inactive", "el cupón no está activo")
	case errors.Is(err, ErrNotStarted):
		return httpx.BadRequest("coupon_not_started", "el cupón aún no es válido")
	case errors.Is(err, ErrExpired):
		return httpx.BadRequest("coupon_expired", "el cupón ha caducado")
	case errors.Is(err, ErrMaxUses):
		return httpx.Conflict("coupon_max_uses", "el cupón ha alcanzado su límite de usos")
	case errors.Is(err, ErrMinSubtotal):
		return httpx.BadRequest("coupon_min_subtotal", "el subtotal no alcanza el mínimo del cupón")
	case errors.Is(err, ErrInvalidType):
		return httpx.NewError(http.StatusInternalServerError, "coupon_invalid_type", "tipo de cupón inválido")
	default:
		return err
	}
}

// NormalizeCode normaliza un código de cupón (mayúsculas, sin espacios).
func NormalizeCode(code string) string {
	return strings.ToUpper(strings.TrimSpace(code))
}

// --- gestión admin ---

// List devuelve todos los cupones.
func (s *Service) List(ctx context.Context) ([]db.DiscountCode, error) {
	return s.q.ListDiscounts(ctx)
}

// Input son los datos para crear o actualizar un cupón.
type Input struct {
	Code             string
	Type             string
	Value            int64
	MinSubtotalCents int64
	MaxUses          *int32
	StartsAt         *time.Time
	ExpiresAt        *time.Time
	IsActive         bool
}

// Create da de alta un cupón.
func (s *Service) Create(ctx context.Context, in Input) (db.DiscountCode, error) {
	if err := validateInput(in); err != nil {
		return db.DiscountCode{}, err
	}
	d, err := s.q.CreateDiscount(ctx, db.CreateDiscountParams{
		Code:             NormalizeCode(in.Code),
		Type:             in.Type,
		Value:            in.Value,
		MinSubtotalCents: in.MinSubtotalCents,
		MaxUses:          in.MaxUses,
		StartsAt:         in.StartsAt,
		ExpiresAt:        in.ExpiresAt,
		IsActive:         in.IsActive,
	})
	if database.IsUniqueViolation(err) {
		return db.DiscountCode{}, httpx.Conflict("code_taken", "ya existe un cupón con ese código")
	}
	return d, err
}

// Update modifica un cupón existente (el código no se cambia).
func (s *Service) Update(ctx context.Context, id uuid.UUID, in Input) (db.DiscountCode, error) {
	if err := validateInput(in); err != nil {
		return db.DiscountCode{}, err
	}
	d, err := s.q.UpdateDiscount(ctx, db.UpdateDiscountParams{
		ID:               id,
		Type:             in.Type,
		Value:            in.Value,
		MinSubtotalCents: in.MinSubtotalCents,
		MaxUses:          in.MaxUses,
		StartsAt:         in.StartsAt,
		ExpiresAt:        in.ExpiresAt,
		IsActive:         in.IsActive,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return db.DiscountCode{}, httpx.NotFound("coupon_not_found", "cupón no encontrado")
	}
	return d, err
}

// Delete elimina un cupón.
func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.q.DeleteDiscount(ctx, id)
}

func validateInput(in Input) error {
	if in.Type != TypePercent && in.Type != TypeFixed {
		return httpx.BadRequest("invalid_type", "tipo debe ser 'percent' o 'fixed'")
	}
	if in.Type == TypePercent && (in.Value < 0 || in.Value > 100) {
		return httpx.BadRequest("invalid_value", "el porcentaje debe estar entre 0 y 100")
	}
	if in.Value < 0 {
		return httpx.BadRequest("invalid_value", "el valor no puede ser negativo")
	}
	return nil
}
