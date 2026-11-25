// Package config carga la configuración de la aplicación desde variables de entorno.
package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config contiene todos los parámetros de ejecución del servicio.
type Config struct {
	DatabaseURL string
	HTTPAddr    string
	JWTSecret   string
	JWTTTL      time.Duration
	CORSOrigin  string
	// DemoReadOnly blocks every write unless the session was opened with OwnerPassword.
	DemoReadOnly  bool
	OwnerPassword string
}

// Load lee la configuración del entorno y aplica valores por defecto razonables
// para desarrollo. Devuelve error solo cuando falta un valor obligatorio.
func Load() (Config, error) {
	cfg := Config{
		DatabaseURL:   getenv("DATABASE_URL", "postgres://app:app@localhost:5432/ecommerce?sslmode=disable"),
		HTTPAddr:      getenv("HTTP_ADDR", ":8080"),
		JWTSecret:     getenv("JWT_SECRET", ""),
		CORSOrigin:    getenv("CORS_ORIGIN", "http://localhost:3000"),
		DemoReadOnly:  os.Getenv("DEMO_READONLY") == "true",
		OwnerPassword: os.Getenv("OWNER_PASSWORD"),
	}

	// Platforms like Vercel assign the port through PORT.
	if port := os.Getenv("PORT"); port != "" && os.Getenv("HTTP_ADDR") == "" {
		cfg.HTTPAddr = ":" + port
	}

	hours, err := strconv.Atoi(getenv("JWT_TTL_HOURS", "24"))
	if err != nil {
		return Config{}, fmt.Errorf("JWT_TTL_HOURS inválido: %w", err)
	}
	cfg.JWTTTL = time.Duration(hours) * time.Hour

	if cfg.JWTSecret == "" {
		return Config{}, fmt.Errorf("JWT_SECRET es obligatorio")
	}

	return cfg, nil
}

func getenv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
