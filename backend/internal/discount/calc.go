// Package discount implementa la validación y el cálculo de cupones de descuento.
package discount

import (
	"errors"
	"time"
)

// Tipos de cupón soportados.
const (
	TypePercent = "percent"
	TypeFixed   = "fixed"
)

// Errores de dominio devueltos por Evaluate. Son centinela para poder
// compararlos con errors.Is en tests y en la capa de servicio.
var (
	ErrInactive    = errors.New("el cupón no está activo")
	ErrNotStarted  = errors.New("el cupón aún no es válido")
	ErrExpired     = errors.New("el cupón ha caducado")
	ErrMaxUses     = errors.New("el cupón ha alcanzado su límite de usos")
	ErrMinSubtotal = errors.New("el subtotal no alcanza el mínimo del cupón")
	ErrInvalidType = errors.New("tipo de cupón desconocido")
)

// Coupon es la representación de dominio de un cupón, independiente de la BD.
type Coupon struct {
	Code             string
	Type             string
	Value            int64 // porcentaje (0-100) si Type=percent; céntimos si Type=fixed
	MinSubtotalCents int64
	MaxUses          *int32 // nil = ilimitado
	UsedCount        int32
	StartsAt         *time.Time // nil = sin inicio
	ExpiresAt        *time.Time // nil = sin caducidad
	IsActive         bool
}

// Evaluate valida el cupón contra un subtotal en un instante dado y devuelve el
// descuento aplicable en céntimos. El descuento nunca supera el subtotal ni es
// negativo. Devuelve un error de dominio si el cupón no es aplicable.
func Evaluate(c Coupon, subtotalCents int64, now time.Time) (int64, error) {
	if !c.IsActive {
		return 0, ErrInactive
	}
	if c.StartsAt != nil && now.Before(*c.StartsAt) {
		return 0, ErrNotStarted
	}
	if c.ExpiresAt != nil && now.After(*c.ExpiresAt) {
		return 0, ErrExpired
	}
	if c.MaxUses != nil && c.UsedCount >= *c.MaxUses {
		return 0, ErrMaxUses
	}
	if subtotalCents < c.MinSubtotalCents {
		return 0, ErrMinSubtotal
	}

	var discount int64
	switch c.Type {
	case TypePercent:
		discount = subtotalCents * c.Value / 100
	case TypeFixed:
		discount = c.Value
	default:
		return 0, ErrInvalidType
	}

	if discount > subtotalCents {
		discount = subtotalCents
	}
	if discount < 0 {
		discount = 0
	}
	return discount, nil
}
