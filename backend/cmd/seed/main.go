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
		{"Audífonos Inalámbricos Sport", 89900, 70, "", "Audio", "Resistentes al sudor IPX5, 8 h de batería y estuche de carga."},
		{"Audífonos de Estudio Over-Ear", 219900, 15, "", "Audio", "Drivers de 50 mm y cable desmontable para producción y mezcla."},
		{"Bocina Bluetooth Mini", 49900, 90, "", "Audio", "Tamaño de bolsillo, 12 h de batería y correa para colgar."},
		{"Barra de Sonido 2.1", 349900, 12, "", "Audio", "Subwoofer inalámbrico, HDMI ARC y modo noche."},
		{"Teclado Compacto 75%", 189900, 35, "", "Periféricos", "Formato 75 %, switches cafés y conexión inalámbrica a tres equipos."},
		{"Mouse Ergonómico Vertical", 79900, 40, "", "Periféricos", "Agarre vertical que reduce la tensión en la muñeca y 6 botones."},
		{"Brazo para Monitor", 129900, 25, "", "Monitores", "Para monitores de 17 a 32 pulgadas, con resorte de gas."},
		{"Monitor 24\" Full HD", 249900, 30, "", "Monitores", "Panel IPS Full HD a 75 Hz con modo de luz azul baja."},
		{"Monitor 32\" 4K", 799900, 8, "", "Monitores", "Panel IPS 4K UHD con HDR10 y USB-C de 65 W."},
		{"SSD Portátil 2TB", 289900, 22, "", "Almacenamiento", "USB-C 3.2 con lectura de hasta 1050 MB/s y carcasa de aluminio."},
		{"Memoria microSD 256GB", 44900, 120, "", "Almacenamiento", "Clase A2 para celulares, cámaras y consolas."},
		{"Webcam Full HD 1080p", 89900, 50, "", "Video", "1080p a 30 fps con micrófono estéreo y tapa de privacidad."},
		{"Cargador Inalámbrico 15W", 54900, 60, "", "Accesorios", "Base Qi para celulares con apagado automático al cargar."},
		{"Hub USB-C 7 en 1", 89900, 45, "", "Accesorios", "HDMI 4K, tres USB-A, lector SD y carga de 100 W."},
		{"Cable USB-C a USB-C 2 m", 24900, 150, "", "Accesorios", "Carga de 100 W y datos a 480 Mbps, recubrimiento trenzado."},
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
	coupons := []db.CreateDiscountParams{
		{Code: "DEMO10", Type: "percent", Value: 10, MinSubtotalCents: 0, IsActive: true},
		// 15 % en compras desde $1,500
		{Code: "BIENVENIDA15", Type: "percent", Value: 15, MinSubtotalCents: 150000, IsActive: true},
		// $200 de descuento en compras desde $1,999
		{Code: "AHORRA200", Type: "fixed", Value: 20000, MinSubtotalCents: 199900, IsActive: true},
	}
	for _, c := range coupons {
		if _, err := q.GetDiscountByCode(ctx, c.Code); err == nil {
			continue // ya existe
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		if _, err := q.CreateDiscount(ctx, c); err != nil {
			return err
		}
		log.Printf("cupón creado: %s", c.Code)
	}
	return nil
}
