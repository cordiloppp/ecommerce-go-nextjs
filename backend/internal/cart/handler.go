package cart

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"ecommerce/internal/auth"
	"ecommerce/internal/discount"
	"ecommerce/internal/platform/httpx"
)

// Handler expone los endpoints del carrito (requieren autenticación).
type Handler struct {
	svc         *Service
	discountSvc *discount.Service
}

// NewHandler crea el handler del carrito.
func NewHandler(svc *Service, discountSvc *discount.Service) *Handler {
	return &Handler{svc: svc, discountSvc: discountSvc}
}

// Routes registra las rutas del carrito.
func (h *Handler) Routes(r chi.Router) {
	r.Get("/cart", h.view)
	r.Post("/cart/items", h.addItem)
	r.Patch("/cart/items/{id}", h.updateItem)
	r.Delete("/cart/items/{id}", h.removeItem)
	r.Delete("/cart", h.clear)
	r.Post("/cart/apply-discount", h.applyDiscount)
}

func userID(r *http.Request) (uuid.UUID, bool) {
	return auth.UserID(r.Context())
}

func (h *Handler) view(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(r)
	if !ok {
		httpx.WriteError(w, httpx.Unauthorized("unauthorized", "no autenticado"))
		return
	}
	v, err := h.svc.View(r.Context(), uid)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, v)
}

type addItemRequest struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Quantity  int32     `json:"quantity" validate:"required,gt=0"`
}

func (h *Handler) addItem(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(r)
	if !ok {
		httpx.WriteError(w, httpx.Unauthorized("unauthorized", "no autenticado"))
		return
	}
	var req addItemRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.WriteError(w, err)
		return
	}
	v, err := h.svc.AddItem(r.Context(), uid, req.ProductID, req.Quantity)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, v)
}

type updateItemRequest struct {
	Quantity int32 `json:"quantity" validate:"required,gt=0"`
}

func (h *Handler) updateItem(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(r)
	if !ok {
		httpx.WriteError(w, httpx.Unauthorized("unauthorized", "no autenticado"))
		return
	}
	itemID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.WriteError(w, httpx.BadRequest("invalid_id", "id inválido"))
		return
	}
	var req updateItemRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.WriteError(w, err)
		return
	}
	v, err := h.svc.UpdateItem(r.Context(), uid, itemID, req.Quantity)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, v)
}

func (h *Handler) removeItem(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(r)
	if !ok {
		httpx.WriteError(w, httpx.Unauthorized("unauthorized", "no autenticado"))
		return
	}
	itemID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.WriteError(w, httpx.BadRequest("invalid_id", "id inválido"))
		return
	}
	v, err := h.svc.RemoveItem(r.Context(), uid, itemID)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, v)
}

func (h *Handler) clear(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(r)
	if !ok {
		httpx.WriteError(w, httpx.Unauthorized("unauthorized", "no autenticado"))
		return
	}
	if err := h.svc.Clear(r.Context(), uid); err != nil {
		httpx.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type applyDiscountRequest struct {
	Code string `json:"code" validate:"required"`
}

type applyDiscountResponse struct {
	Code          string `json:"code"`
	SubtotalCents int64  `json:"subtotal_cents"`
	DiscountCents int64  `json:"discount_cents"`
	TotalCents    int64  `json:"total_cents"`
}

// applyDiscount calcula (sin canjear) el efecto de un cupón sobre el carrito.
func (h *Handler) applyDiscount(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(r)
	if !ok {
		httpx.WriteError(w, httpx.Unauthorized("unauthorized", "no autenticado"))
		return
	}
	var req applyDiscountRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.WriteError(w, err)
		return
	}

	v, err := h.svc.View(r.Context(), uid)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}
	if len(v.Items) == 0 {
		httpx.WriteError(w, httpx.BadRequest("empty_cart", "el carrito está vacío"))
		return
	}

	d, discountCents, err := h.discountSvc.Validate(r.Context(), req.Code, v.SubtotalCents)
	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, applyDiscountResponse{
		Code:          d.Code,
		SubtotalCents: v.SubtotalCents,
		DiscountCents: discountCents,
		TotalCents:    v.SubtotalCents - discountCents,
	})
}
