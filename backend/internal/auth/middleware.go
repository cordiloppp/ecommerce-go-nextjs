package auth

import (
	"net/http"
	"strings"

	"ecommerce/internal/platform/httpx"
)

// RequireAuth devuelve un middleware que exige un JWT válido en la cabecera
// Authorization (esquema Bearer) y coloca la identidad en el contexto.
func RequireAuth(m *Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
				httpx.WriteError(w, httpx.Unauthorized("missing_token", "falta el token Bearer"))
				return
			}

			claims, err := m.Parse(parts[1])
			if err != nil {
				httpx.WriteError(w, httpx.Unauthorized("invalid_token", "token inválido o expirado"))
				return
			}

			ctx := withIdentity(r.Context(), claims.UserID, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAdmin debe usarse tras RequireAuth; rechaza a quien no tenga rol admin.
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role, ok := Role(r.Context())
		if !ok || role != RoleAdmin {
			httpx.WriteError(w, httpx.Forbidden("forbidden", "se requiere rol de administrador"))
			return
		}
		next.ServeHTTP(w, r)
	})
}
