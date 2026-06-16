-- name: CreateOrder :one
INSERT INTO orders (
    user_id, subtotal_cents, discount_cents, total_cents, discount_code, status
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: CreateOrderItem :one
INSERT INTO order_items (
    order_id, product_id, product_name, quantity, unit_price_cents
)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetOrderByID :one
SELECT * FROM orders
WHERE id = $1 AND user_id = $2;

-- name: ListOrdersByUser :many
SELECT * FROM orders
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: ListOrderItems :many
SELECT * FROM order_items
WHERE order_id = $1
ORDER BY id ASC;
