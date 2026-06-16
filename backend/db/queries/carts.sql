-- name: CreateCart :one
INSERT INTO carts (user_id)
VALUES ($1)
ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
RETURNING *;

-- name: GetCartByUserID :one
SELECT * FROM carts
WHERE user_id = $1;

-- name: ListCartItems :many
SELECT
    ci.id,
    ci.cart_id,
    ci.product_id,
    ci.quantity,
    ci.unit_price_cents,
    p.name        AS product_name,
    p.slug        AS product_slug,
    p.image_url   AS product_image_url,
    p.stock       AS product_stock,
    p.price_cents AS product_price_cents,
    p.is_active   AS product_is_active
FROM cart_items ci
JOIN products p ON p.id = ci.product_id
WHERE ci.cart_id = $1
ORDER BY ci.created_at ASC;

-- name: GetCartItemByID :one
SELECT * FROM cart_items
WHERE id = $1 AND cart_id = $2;

-- name: UpsertCartItem :one
INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_cents)
VALUES ($1, $2, $3, $4)
ON CONFLICT (cart_id, product_id)
DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
RETURNING *;

-- name: UpdateCartItemQuantity :one
UPDATE cart_items
SET quantity = $3
WHERE id = $1 AND cart_id = $2
RETURNING *;

-- name: DeleteCartItem :exec
DELETE FROM cart_items
WHERE id = $1 AND cart_id = $2;

-- name: ClearCart :exec
DELETE FROM cart_items
WHERE cart_id = $1;
