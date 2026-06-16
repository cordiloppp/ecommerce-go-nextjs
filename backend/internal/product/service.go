// Package product implementa el catálogo de productos y su gestión por admin.
package product

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"ecommerce/internal/db"
	"ecommerce/internal/platform/database"
	"ecommerce/internal/platform/httpx"
)

// Service contiene la lógica del catálogo.
type Service struct {
	q *db.Queries
}

// NewService crea el servicio de productos.
func NewService(q *db.Queries) *Service {
	return &Service{q: q}
}

// ListFilter agrupa los filtros y la paginación del listado público.
type ListFilter struct {
	Category string
	Search   string
	Limit    int32
	Offset   int32
}

// ListResult es la respuesta paginada del catálogo.
type ListResult struct {
	Items []db.Product `json:"items"`
	Total int64        `json:"total"`
	Limit int32        `json:"limit"`
	Offset int32       `json:"offset"`
}

// List devuelve productos activos aplicando filtros y paginación.
func (s *Service) List(ctx context.Context, f ListFilter) (ListResult, error) {
	if f.Limit <= 0 || f.Limit > 100 {
		f.Limit = 20
	}
	if f.Offset < 0 {
		f.Offset = 0
	}

	category := nilIfEmpty(f.Category)
	search := nilIfEmpty(f.Search)

	items, err := s.q.ListProducts(ctx, db.ListProductsParams{
		Category: category,
		Search:   search,
		Lim:      f.Limit,
		Off:      f.Offset,
	})
	if err != nil {
		return ListResult{}, err
	}

	total, err := s.q.CountProducts(ctx, db.CountProductsParams{
		Category: category,
		Search:   search,
	})
	if err != nil {
		return ListResult{}, err
	}

	return ListResult{Items: items, Total: total, Limit: f.Limit, Offset: f.Offset}, nil
}

// GetBySlug devuelve un producto activo por su slug.
func (s *Service) GetBySlug(ctx context.Context, slug string) (db.Product, error) {
	p, err := s.q.GetProductBySlug(ctx, slug)
	if errors.Is(err, pgx.ErrNoRows) {
		return db.Product{}, httpx.NotFound("product_not_found", "producto no encontrado")
	}
	return p, err
}

// Input son los datos para crear o actualizar un producto (panel admin).
type Input struct {
	Name        string
	Slug        string
	Description string
	PriceCents  int64
	Currency    string
	Stock       int32
	ImageURL    string
	Category    string
	IsActive    bool
}

// Create da de alta un producto.
func (s *Service) Create(ctx context.Context, in Input) (db.Product, error) {
	in.normalize()
	p, err := s.q.CreateProduct(ctx, db.CreateProductParams{
		Name:        in.Name,
		Slug:        in.Slug,
		Description: in.Description,
		PriceCents:  in.PriceCents,
		Currency:    in.Currency,
		Stock:       in.Stock,
		ImageUrl:    in.ImageURL,
		Category:    in.Category,
		IsActive:    in.IsActive,
	})
	if database.IsUniqueViolation(err) {
		return db.Product{}, httpx.Conflict("slug_taken", "ya existe un producto con ese slug")
	}
	return p, err
}

// Update modifica un producto existente.
func (s *Service) Update(ctx context.Context, id uuid.UUID, in Input) (db.Product, error) {
	in.normalize()
	p, err := s.q.UpdateProduct(ctx, db.UpdateProductParams{
		ID:          id,
		Name:        in.Name,
		Slug:        in.Slug,
		Description: in.Description,
		PriceCents:  in.PriceCents,
		Currency:    in.Currency,
		Stock:       in.Stock,
		ImageUrl:    in.ImageURL,
		Category:    in.Category,
		IsActive:    in.IsActive,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return db.Product{}, httpx.NotFound("product_not_found", "producto no encontrado")
	}
	if database.IsUniqueViolation(err) {
		return db.Product{}, httpx.Conflict("slug_taken", "ya existe un producto con ese slug")
	}
	return p, err
}

// Delete elimina un producto.
func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.q.DeleteProduct(ctx, id)
}

func (in *Input) normalize() {
	in.Name = strings.TrimSpace(in.Name)
	in.Slug = strings.TrimSpace(in.Slug)
	if in.Slug == "" {
		in.Slug = Slugify(in.Name)
	} else {
		in.Slug = Slugify(in.Slug)
	}
	if in.Currency == "" {
		in.Currency = "EUR"
	}
}

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

// Slugify convierte un texto en un slug url-friendly.
func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = nonSlug.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

func nilIfEmpty(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}
