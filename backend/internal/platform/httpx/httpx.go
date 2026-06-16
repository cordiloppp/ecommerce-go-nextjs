// Package httpx contiene utilidades compartidas para los handlers HTTP:
// codificación JSON, manejo uniforme de errores y validación de payloads.
package httpx

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New(validator.WithRequiredStructEnabled())

// APIError representa un error de dominio con un código HTTP y un código legible
// por máquina. Los servicios devuelven estos errores y los handlers los traducen.
type APIError struct {
	Status  int    `json:"-"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *APIError) Error() string { return e.Message }

// NewError construye un APIError.
func NewError(status int, code, message string) *APIError {
	return &APIError{Status: status, Code: code, Message: message}
}

// Atajos para los errores más comunes.
func BadRequest(code, msg string) *APIError   { return NewError(http.StatusBadRequest, code, msg) }
func Unauthorized(code, msg string) *APIError { return NewError(http.StatusUnauthorized, code, msg) }
func Forbidden(code, msg string) *APIError    { return NewError(http.StatusForbidden, code, msg) }
func NotFound(code, msg string) *APIError     { return NewError(http.StatusNotFound, code, msg) }
func Conflict(code, msg string) *APIError     { return NewError(http.StatusConflict, code, msg) }

// WriteJSON serializa v como JSON con el código de estado indicado.
func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

// WriteError traduce cualquier error a una respuesta JSON. Si es un *APIError
// se respeta su estado; en caso contrario se devuelve 500 sin filtrar detalles.
func WriteError(w http.ResponseWriter, err error) {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		WriteJSON(w, apiErr.Status, map[string]any{"error": apiErr})
		return
	}
	WriteJSON(w, http.StatusInternalServerError, map[string]any{
		"error": &APIError{Code: "internal_error", Message: "error interno del servidor"},
	})
}

// Decode lee el cuerpo JSON de la petición en dst y valida sus etiquetas
// `validate`. Devuelve un *APIError 400 si el JSON o la validación fallan.
func Decode(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return BadRequest("invalid_json", "cuerpo JSON inválido: "+err.Error())
	}
	if err := validate.Struct(dst); err != nil {
		return BadRequest("validation_error", "datos inválidos: "+err.Error())
	}
	return nil
}
