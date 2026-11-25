# E-commerce de productos electrónicos

**Demo en vivo:** https://ecommerce-go-nextjs.vercel.app · admin: `admin@demo.com` / `admin1234` · cupón `DEMO10`

> La demo pública es de **solo lectura** (`DEMO_READONLY=true`): se puede ver el catálogo y el panel, pero registrarse, usar el carrito, comprar o editar responde 403. Solo una sesión abierta con `OWNER_PASSWORD` puede escribir.

Publicado en Vercel como dos servicios (Next.js + API en Go) con PostgreSQL en Neon. Las migraciones se aplican al arrancar la API.

Monorepo full-stack:

- **`backend/`** — API REST en Go 1.22 (chi + pgx/v5 + sqlc), JWT auth, PostgreSQL.
- **`frontend/`** — Next.js (React + TypeScript + Tailwind).
- **`docker-compose.yml`** — orquesta Postgres + backend + frontend en local.

Funcionalidades: catálogo de productos, carrito de compras, registro/login (JWT),
cupones de descuento y panel de administración. El pago está **simulado**.

## Requisitos

Solo necesitas **Docker** (y Docker Compose). No hace falta tener Go ni Node instalados;
todo se construye dentro de contenedores.

## Arranque rápido

```bash
docker compose up --build
```

Esto levanta:

| Servicio   | URL                     | Notas                          |
|------------|-------------------------|--------------------------------|
| Frontend   | http://localhost:3000   | Tienda + panel admin           |
| Backend    | http://localhost:8088   | API REST (`/api/...`)          |
| Postgres   | localhost:5432          | usuario/clave: `app` / `app`   |
| Adminer    | http://localhost:8081   | Cliente web de la BD (opcional)|

Las **migraciones se aplican automáticamente** al arrancar el backend.

### Cargar datos de ejemplo (seed)

```bash
docker compose run --rm --entrypoint /app/seed backend
```

Crea productos demo, un usuario admin (`admin@demo.com` / `admin1234`) y un cupón `DEMO10`
(10% de descuento).

## Comandos de desarrollo (Go vía Docker)

```bash
# Compilar
docker compose run --rm backend go build ./...

# Tests con race detector y cobertura
docker compose run --rm backend go test ./... -race -cover

# Regenerar código de sqlc (tras cambiar db/queries o db/migrations)
docker run --rm -v "${PWD}/backend:/src" -w /src sqlc/sqlc:1.27.0 generate
```

## Estructura

Ver el plan completo en la documentación del repo. Backend organizado por dominios
(`auth`, `user`, `product`, `cart`, `discount`, `order`) en arquitectura por capas
(handler → service → repository).
