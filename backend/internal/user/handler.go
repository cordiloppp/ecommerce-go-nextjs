package user

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"ecommerce/internal/auth"
	"ecommerce/internal/platform/httpx"
)

// Handler expone los endpoints HTTP de autenticación.
type Handler struct {
	svc *Service
}

// NewHandler crea el handler de usuarios.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RoutesPublic registra las rutas públicas de autenticación.
func (h *Handler) RoutesPublic(r chi.Router) {
	r.Post("/auth/register", h.register)
	r.Post("/auth/login", h.login)
	r.Post("/auth/demo", h.demo)
}

// RoutesProtected registra las rutas que requieren autenticación.
func (h *Handler) RoutesProtected(r chi.Router) {
	r.Get("/auth/me", h.me)
}

type registerRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=72"`
	Name     string `json:"name" validate:"required,min=2,max=120"`
}

type authResponse struct {
	User  Public `json:"user"`
	Token string `json:"token"`
}

func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.WriteError(w, err)
		return
	}
	u, token, err := h.svc.Register(r.Context(), req.Email, req.Password, req.Name)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, authResponse{User: u, Token: token})
}

// demo opens the read-only demo account so visitors need no account.
func (h *Handler) demo(w http.ResponseWriter, r *http.Request) {
	u, token, err := h.svc.DemoSession(r.Context())
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, authResponse{User: u, Token: token})
}

type loginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.WriteError(w, err)
		return
	}
	u, token, err := h.svc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, authResponse{User: u, Token: token})
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	id, ok := auth.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, httpx.Unauthorized("unauthorized", "no autenticado"))
		return
	}
	u, err := h.svc.Me(r.Context(), id)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, u)
}
