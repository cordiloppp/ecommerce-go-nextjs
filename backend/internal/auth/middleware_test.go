package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
)

func demoHandler(m *Manager) http.Handler {
	ok := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
	return DemoReadOnly(m)(ok)
}

func doRequest(t *testing.T, h http.Handler, method, path, token string) int {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec.Code
}

func TestDemoReadOnly(t *testing.T) {
	m := NewManager("secreto-de-prueba", time.Hour)
	m.SetReadOnly(true)
	h := demoHandler(m)
	id := uuid.New()

	visitor, err := m.Generate(id, RoleAdmin)
	if err != nil {
		t.Fatal(err)
	}
	owner, err := m.GenerateOwner(id, RoleAdmin)
	if err != nil {
		t.Fatal(err)
	}

	cases := []struct {
		name, method, path, token string
		want                      int
	}{
		{"lectura sin sesión", http.MethodGet, "/api/products", "", http.StatusOK},
		{"login siempre permitido", http.MethodPost, "/api/auth/login", "", http.StatusOK},
		{"demo sin cuenta permitido", http.MethodPost, "/api/auth/demo", "", http.StatusOK},
		{"registro bloqueado", http.MethodPost, "/api/auth/register", "", http.StatusForbidden},
		{"admin demo no puede editar", http.MethodPut, "/api/admin/products/1", visitor, http.StatusForbidden},
		{"admin demo no puede borrar", http.MethodDelete, "/api/admin/products/1", visitor, http.StatusForbidden},
		{"token inválido bloqueado", http.MethodPost, "/api/cart/items", "no-es-un-token", http.StatusForbidden},
		{"dueño puede editar", http.MethodPut, "/api/admin/products/1", owner, http.StatusOK},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := doRequest(t, h, c.method, c.path, c.token); got != c.want {
				t.Fatalf("%s %s: código %d, se esperaba %d", c.method, c.path, got, c.want)
			}
		})
	}
}

func TestSinModoDemoTodoPermitido(t *testing.T) {
	m := NewManager("secreto-de-prueba", time.Hour)
	h := demoHandler(m)
	token, err := m.Generate(uuid.New(), "customer")
	if err != nil {
		t.Fatal(err)
	}
	if got := doRequest(t, h, http.MethodPost, "/api/cart/items", token); got != http.StatusOK {
		t.Fatalf("código %d, se esperaba 200", got)
	}
}
