// Package server cablea servicios, handlers y middlewares en un router HTTP.
package server

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecommerce/internal/auth"
	"ecommerce/internal/cart"
	"ecommerce/internal/config"
	"ecommerce/internal/db"
	"ecommerce/internal/discount"
	"ecommerce/internal/order"
	"ecommerce/internal/platform/httpx"
	"ecommerce/internal/product"
	"ecommerce/internal/user"
)

// New construye el handler HTTP raíz de la aplicación.
func New(cfg config.Config, pool *pgxpool.Pool) http.Handler {
	q := db.New(pool)
	jwtMgr := auth.NewManager(cfg.JWTSecret, cfg.JWTTTL)
	jwtMgr.SetReadOnly(cfg.DemoReadOnly)

	// Servicios
	userSvc := user.NewService(q, jwtMgr, cfg.OwnerPassword)
	userSvc.SetDemoEmail(cfg.DemoEmail)
	productSvc := product.NewService(q)
	discountSvc := discount.NewService(q)
	cartSvc := cart.NewService(q)
	orderSvc := order.NewService(pool, q)

	// Handlers
	userH := user.NewHandler(userSvc)
	productH := product.NewHandler(productSvc)
	discountH := discount.NewHandler(discountSvc)
	cartH := cart.NewHandler(cartSvc, discountSvc)
	orderH := order.NewHandler(orderSvc)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Route("/api", func(r chi.Router) {
		r.Use(auth.DemoReadOnly(jwtMgr))
		r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
			httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
		})

		// Rutas públicas
		userH.RoutesPublic(r)
		productH.RoutesPublic(r)
		discountH.RoutesPublic(r)

		// Rutas autenticadas
		r.Group(func(r chi.Router) {
			r.Use(auth.RequireAuth(jwtMgr))

			userH.RoutesProtected(r)
			cartH.Routes(r)
			orderH.Routes(r)

			// Rutas solo admin
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireAdmin)
				productH.RoutesAdmin(r)
				discountH.RoutesAdmin(r)
			})
		})
	})

	return r
}
