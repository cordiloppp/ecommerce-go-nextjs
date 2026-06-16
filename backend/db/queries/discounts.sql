-- name: GetDiscountByCode :one
SELECT * FROM discount_codes
WHERE code = $1;

-- name: ListDiscounts :many
SELECT * FROM discount_codes
ORDER BY created_at DESC;

-- name: CreateDiscount :one
INSERT INTO discount_codes (
    code, type, value, min_subtotal_cents, max_uses, starts_at, expires_at, is_active
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateDiscount :one
UPDATE discount_codes
SET type = $2,
    value = $3,
    min_subtotal_cents = $4,
    max_uses = $5,
    starts_at = $6,
    expires_at = $7,
    is_active = $8
WHERE id = $1
RETURNING *;

-- name: DeleteDiscount :exec
DELETE FROM discount_codes
WHERE id = $1;

-- name: RedeemDiscount :one
UPDATE discount_codes
SET used_count = used_count + 1
WHERE id = sqlc.arg('id')
  AND is_active = TRUE
  AND (max_uses IS NULL OR used_count < max_uses)
RETURNING *;
