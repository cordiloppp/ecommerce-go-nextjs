-- name: ListProducts :many
SELECT * FROM products
WHERE is_active = TRUE
  AND (sqlc.narg('category')::text IS NULL OR category = sqlc.narg('category'))
  AND (sqlc.narg('search')::text IS NULL OR name ILIKE '%' || sqlc.narg('search') || '%')
ORDER BY created_at DESC
LIMIT sqlc.arg('lim') OFFSET sqlc.arg('off');

-- name: CountProducts :one
SELECT count(*) FROM products
WHERE is_active = TRUE
  AND (sqlc.narg('category')::text IS NULL OR category = sqlc.narg('category'))
  AND (sqlc.narg('search')::text IS NULL OR name ILIKE '%' || sqlc.narg('search') || '%');

-- name: GetProductBySlug :one
SELECT * FROM products
WHERE slug = $1 AND is_active = TRUE;

-- name: GetProductByID :one
SELECT * FROM products
WHERE id = $1;

-- name: GetProductForUpdate :one
SELECT * FROM products
WHERE id = $1
FOR UPDATE;

-- name: CreateProduct :one
INSERT INTO products (name, slug, description, price_cents, currency, stock, image_url, category, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: UpdateProduct :one
UPDATE products
SET name = $2,
    slug = $3,
    description = $4,
    price_cents = $5,
    currency = $6,
    stock = $7,
    image_url = $8,
    category = $9,
    is_active = $10,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteProduct :exec
DELETE FROM products
WHERE id = $1;

-- name: DecrementStock :one
UPDATE products
SET stock = stock - sqlc.arg('qty'),
    updated_at = now()
WHERE id = sqlc.arg('id') AND stock >= sqlc.arg('qty')
RETURNING *;
