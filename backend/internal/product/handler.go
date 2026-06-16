package product

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"ecommerce/internal/platform/httpx"
)

// Handler expone los endpoints HTTP del catálogo.
type Handler struct {
	svc *Service
}

// NewHandler crea el handler de productos.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RoutesPublic registra las rutas públicas del catálogo.
func (h *Handler) RoutesPublic(r chi.Router) {
	r.Get("/products", h.list)
	r.Get("/products/{slug}", h.getBySlug)
}

// RoutesAdmin registra el CRUD de productos (requiere rol admin).
func (h *Handler) RoutesAdmin(r chi.Router) {
	r.Post("/admin/products", h.create)
	r.Put("/admin/products/{id}", h.update)
	r.Delete("/admin/products/{id}", h.delete)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))

	res, err := h.svc.List(r.Context(), ListFilter{
		Category: q.Get("category"),
		Search:   q.Get("search"),
		Limit:    int32(limit),
		Offset:   int32(offset),
	})
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

func (h *Handler) getBySlug(w http.ResponseWriter, r *http.Request) {
	p, err := h.svc.GetBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, p)
}

type productRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=200"`
	Slug        string `json:"slug" validate:"omitempty,max=200"`
	Description string `json:"description" validate:"max=5000"`
	PriceCents  int64  `json:"price_cents" validate:"gte=0"`
	Currency    string `json:"currency" validate:"omitempty,len=3"`
	Stock       int32  `json:"stock" validate:"gte=0"`
	ImageURL    string `json:"image_url" validate:"omitempty,url"`
	Category    string `json:"category" validate:"max=100"`
	IsActive    bool   `json:"is_active"`
}

func (req productRequest) toInput() Input {
	return Input{
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		PriceCents:  req.PriceCents,
		Currency:    req.Currency,
		Stock:       req.Stock,
		ImageURL:    req.ImageURL,
		Category:    req.Category,
		IsActive:    req.IsActive,
	}
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var req productRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.WriteError(w, err)
		return
	}
	p, err := h.svc.Create(r.Context(), req.toInput())
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, p)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.WriteError(w, httpx.BadRequest("invalid_id", "id inválido"))
		return
	}
	var req productRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.WriteError(w, err)
		return
	}
	p, err := h.svc.Update(r.Context(), id, req.toInput())
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, p)
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
