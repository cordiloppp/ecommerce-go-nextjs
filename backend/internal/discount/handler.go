package discount

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"ecommerce/internal/platform/httpx"
)

// Handler expone la gestión de cupones (solo admin).
type Handler struct {
	svc *Service
}

// NewHandler crea el handler de descuentos.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RoutesAdmin registra el CRUD de cupones bajo /admin/discounts.
func (h *Handler) RoutesAdmin(r chi.Router) {
	r.Get("/admin/discounts", h.list)
	r.Post("/admin/discounts", h.create)
	r.Put("/admin/discounts/{id}", h.update)
	r.Delete("/admin/discounts/{id}", h.delete)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.List(r.Context())
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"items": items})
}

type discountRequest struct {
	Code             string     `json:"code" validate:"required,min=3,max=40"`
	Type             string     `json:"type" validate:"required,oneof=percent fixed"`
	Value            int64      `json:"value" validate:"gte=0"`
	MinSubtotalCents int64      `json:"min_subtotal_cents" validate:"gte=0"`
	MaxUses          *int32     `json:"max_uses" validate:"omitempty,gte=1"`
	StartsAt         *time.Time `json:"starts_at"`
	ExpiresAt        *time.Time `json:"expires_at"`
	IsActive         bool       `json:"is_active"`
}

func (req discountRequest) toInput() Input {
	return Input{
		Code:             req.Code,
		Type:             req.Type,
		Value:            req.Value,
		MinSubtotalCents: req.MinSubtotalCents,
		MaxUses:          req.MaxUses,
		StartsAt:         req.StartsAt,
		ExpiresAt:        req.ExpiresAt,
		IsActive:         req.IsActive,
	}
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var req discountRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.WriteError(w, err)
		return
	}
	d, err := h.svc.Create(r.Context(), req.toInput())
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, d)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.WriteError(w, httpx.BadRequest("invalid_id", "id inválido"))
		return
	}
	var req discountRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.WriteError(w, err)
		return
	}
	d, err := h.svc.Update(r.Context(), id, req.toInput())
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, d)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.WriteError(w, httpx.BadRequest("invalid_id", "id inválido"))
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		httpx.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
