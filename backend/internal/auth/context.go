package auth

import (
	"context"

	"github.com/google/uuid"
)

// Roles disponibles en el sistema.
const (
	RoleCustomer = "customer"
	RoleAdmin    = "admin"
)

type ctxKey int

const (
	ctxKeyUserID ctxKey = iota
	ctxKeyRole
)

// withIdentity guarda el id de usuario y el rol en el contexto.
func withIdentity(ctx context.Context, userID uuid.UUID, role string) context.Context {
	ctx = context.WithValue(ctx, ctxKeyUserID, userID)
	ctx = context.WithValue(ctx, ctxKeyRole, role)
	return ctx
}

// UserID recupera el id del usuario autenticado del contexto.
func UserID(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(ctxKeyUserID).(uuid.UUID)
	return id, ok
}

// Role recupera el rol del usuario autenticado del contexto.
func Role(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(ctxKeyRole).(string)
	return role, ok
}
