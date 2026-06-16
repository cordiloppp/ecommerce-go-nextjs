package discount

import (
	"errors"
	"testing"
	"time"
)

func ptrInt32(v int32) *int32       { return &v }
func ptrTime(t time.Time) *time.Time { return &t }

func TestEvaluate(t *testing.T) {
	now := time.Date(2026, 6, 16, 12, 0, 0, 0, time.UTC)
	yesterday := now.Add(-24 * time.Hour)
	tomorrow := now.Add(24 * time.Hour)

	tests := []struct {
		name         string
		coupon       Coupon
		subtotal     int64
		wantDiscount int64
		wantErr      error
	}{
		{
			name:         "porcentaje 10%",
			coupon:       Coupon{Type: TypePercent, Value: 10, IsActive: true},
			subtotal:     10000,
			wantDiscount: 1000,
		},
		{
			name:         "fijo 500 céntimos",
			coupon:       Coupon{Type: TypeFixed, Value: 500, IsActive: true},
			subtotal:     10000,
			wantDiscount: 500,
		},
		{
			name:         "fijo mayor que subtotal se capa al subtotal",
			coupon:       Coupon{Type: TypeFixed, Value: 99999, IsActive: true},
			subtotal:     3000,
			wantDiscount: 3000,
		},
		{
			name:     "inactivo",
			coupon:   Coupon{Type: TypePercent, Value: 10, IsActive: false},
			subtotal: 10000,
			wantErr:  ErrInactive,
		},
		{
			name:     "aún no empieza",
			coupon:   Coupon{Type: TypePercent, Value: 10, IsActive: true, StartsAt: ptrTime(tomorrow)},
			subtotal: 10000,
			wantErr:  ErrNotStarted,
		},
		{
			name:     "caducado",
			coupon:   Coupon{Type: TypePercent, Value: 10, IsActive: true, ExpiresAt: ptrTime(yesterday)},
			subtotal: 10000,
			wantErr:  ErrExpired,
		},
		{
			name:     "límite de usos alcanzado",
			coupon:   Coupon{Type: TypePercent, Value: 10, IsActive: true, MaxUses: ptrInt32(5), UsedCount: 5},
			subtotal: 10000,
			wantErr:  ErrMaxUses,
		},
		{
			name:     "subtotal por debajo del mínimo",
			coupon:   Coupon{Type: TypePercent, Value: 10, IsActive: true, MinSubtotalCents: 5000},
			subtotal: 4999,
			wantErr:  ErrMinSubtotal,
		},
		{
			name:         "subtotal justo en el mínimo",
			coupon:       Coupon{Type: TypePercent, Value: 10, IsActive: true, MinSubtotalCents: 5000},
			subtotal:     5000,
			wantDiscount: 500,
		},
		{
			name:         "usos restantes disponibles",
			coupon:       Coupon{Type: TypePercent, Value: 20, IsActive: true, MaxUses: ptrInt32(10), UsedCount: 9},
			subtotal:     10000,
			wantDiscount: 2000,
		},
		{
			name:     "tipo inválido",
			coupon:   Coupon{Type: "bogus", Value: 10, IsActive: true},
			subtotal: 10000,
			wantErr:  ErrInvalidType,
		},
		{
			name:         "vigente entre fechas",
			coupon:       Coupon{Type: TypePercent, Value: 15, IsActive: true, StartsAt: ptrTime(yesterday), ExpiresAt: ptrTime(tomorrow)},
			subtotal:     20000,
			wantDiscount: 3000,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Evaluate(tt.coupon, tt.subtotal, now)
			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("error = %v, se esperaba %v", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("error inesperado: %v", err)
			}
			if got != tt.wantDiscount {
				t.Errorf("descuento = %d, se esperaba %d", got, tt.wantDiscount)
			}
		})
	}
}
