package order

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"ecommerce/internal/auth"
	"ecommerce/internal/platform/httpx"
)

// Handler expone los endpoints de pedidos (requieren autenticación).
type Handler struct {
	svc *Service
}

// NewHandler crea el handler de pedidos.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// Routes registra las rutas de pedidos y checkout.
func (h *Handler) Routes(r chi.Router) {
	r.Post("/checkout", h.checkout)
	r.Get("/orders", h.list)
	r.Get("/orders/{id}", h.get)
}

type checkoutRequest struct {
	DiscountCode string `json:"discount_code" validate:"omitempty,max=40"`
}

func (h *Handler) checkout(w http.ResponseWriter, r *http.Request) {
	uid, ok := auth.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, httpx.Unauthorized("unauthorized", "no autenticado"))
		return
	}
	var req checkoutRequest
	// El cuerpo es opcional; si viene vacío, se trata como sin cupón.
	if r.ContentLength > 0 {
		if err := httpx.Decode(r, &req); err != nil {
			httpx.WriteError(w, err)
			return
		}
	}
	res, err := h.svc.Checkout(r.Context(), uid, req.DiscountCode)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, res)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	uid, ok := auth.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, httpx.Unauthorized("unauthorized", "no autenticado"))
		return
	}
	orders, err := h.svc.List(r.Context(), uid)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"items": orders})
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	uid, ok := auth.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, httpx.Unauthorized("unauthorized", "no autenticado"))
		return
	}
	orderID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.WriteError(w, httpx.BadRequest("invalid_id", "id inválido"))
		return
	}
	res, err := h.svc.Get(r.Context(), uid, orderID)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}
