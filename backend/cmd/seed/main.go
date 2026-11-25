// Command seed inserta datos de ejemplo (admin, productos y un cupón) de forma
// idempotente. Útil para desarrollo y demos.
package main

import (
	"context"
	"errors"
	"log"

	"github.com/jackc/pgx/v5"

	migrations "ecommerce/db/migrations"
	"ecommerce/internal/auth"
	"ecommerce/internal/config"
	"ecommerce/internal/db"
	"ecommerce/internal/platform/database"
	"ecommerce/internal/product"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("seed fatal: %v", err)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx := context.Background()
	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	if err := database.Migrate(ctx, pool, migrations.FS); err != nil {
		return err
	}

	q := db.New(pool)

	if err := seedAdmin(ctx, q); err != nil {
		return err
	}
	if err := seedProducts(ctx, q); err != nil {
		return err
	}
	if err := seedDiscount(ctx, q); err != nil {
		return err
	}

	log.Println("seed completado")
	return nil
}

func seedAdmin(ctx context.Context, q *db.Queries) error {
	const email = "admin@demo.com"
	if _, err := q.GetUserByEmail(ctx, email); err == nil {
		log.Println("admin ya existe, omitiendo")
		return nil
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	hash, err := auth.HashPassword("admin1234")
	if err != nil {
		return err
	}
	if _, err := q.CreateUser(ctx, db.CreateUserParams{
		Email:        email,
		PasswordHash: hash,
		Name:         "Administrador",
		Role:         auth.RoleAdmin,
	}); err != nil {
		return err
	}
	log.Printf("admin creado: %s / admin1234", email)
	return nil
}

type demoProduct struct {
	name     string
	price    int64
	stock    int32
	image    string
	category string
	desc     string
}

func seedProducts(ctx context.Context, q *db.Queries) error {
	demos := []demoProduct{
		{"Audífonos Bluetooth Pro", 179900, 50, "", "Audio", "Cancelación de ruido activa y 30h de batería."},
		{"Teclado Mecánico RGB", 259900, 30, "", "Periféricos", "Switches rojos, retroiluminación RGB y reposamuñecas."},
		{"Mouse Gamer 16000 DPI", 109900, 60, "", "Periféricos", "Sensor óptico de alta precisión y 8 botones programables."},
		{"Monitor 27\" 144Hz", 499900, 20, "", "Monitores", "Panel IPS QHD, 144Hz y 1ms de respuesta."},
		{"SSD NVMe 1TB", 199900, 40, "", "Almacenamiento", "Lectura de hasta 7000 MB/s."},
		{"Webcam 4K", 159900, 25, "", "Video", "Grabación en 4K con enfoque automático."},
		{"Cargador USB-C 100W", 69900, 80, "", "Accesorios", "Carga rápida GaN para laptops y celulares."},
		{"Bocina Portátil", 89900, 45, "", "Audio", "Resistente al agua IPX7 y 20h de autonomía."},
	}

	for _, d := range demos {
		slug := product.Slugify(d.name)
		if _, err := q.GetProductBySlug(ctx, slug); err == nil {
			continue // ya existe
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		if _, err := q.CreateProduct(ctx, db.CreateProductParams{
			Name:        d.name,
			Slug:        slug,
			Description: d.desc,
			PriceCents:  d.price,
			Currency:    "MXN",
			Stock:       d.stock,
			ImageUrl:    d.image,
			Category:    d.category,
			IsActive:    true,
		}); err != nil {
			return err
		}
		log.Printf("producto creado: %s", d.name)
	}
	return nil
}

func seedDiscount(ctx context.Context, q *db.Queries) error {
	const code = "DEMO10"
	if _, err := q.GetDiscountByCode(ctx, code); err == nil {
		log.Println("cupón DEMO10 ya existe, omitiendo")
		return nil
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	if _, err := q.CreateDiscount(ctx, db.CreateDiscountParams{
		Code:             code,
		Type:             "percent",
		Value:            10,
		MinSubtotalCents: 0,
		IsActive:         true,
	}); err != nil {
		return err
	}
	log.Println("cupón creado: DEMO10 (10%)")
	return nil
}
