package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims son los datos que viajan dentro del JWT.
type Claims struct {
	UserID uuid.UUID `json:"uid"`
	Role   string    `json:"role"`
	// RW is false for sessions of the public read-only demo.
	RW bool `json:"rw"`
	jwt.RegisteredClaims
}

// Manager emite y valida tokens JWT firmados con HMAC.
type Manager struct {
	secret   []byte
	ttl      time.Duration
	readOnly bool
}

// SetReadOnly makes regular sessions read-only (public demo mode).
func (m *Manager) SetReadOnly(readOnly bool) { m.readOnly = readOnly }

// ReadOnly reports whether the public demo mode is on.
func (m *Manager) ReadOnly() bool { return m.readOnly }

// NewManager crea un Manager con el secreto y el tiempo de vida indicados.
func NewManager(secret string, ttl time.Duration) *Manager {
	return &Manager{secret: []byte(secret), ttl: ttl}
}

// Generate emite un token firmado para el usuario y rol indicados.
func (m *Manager) Generate(userID uuid.UUID, role string) (string, error) {
	return m.generate(userID, role, !m.readOnly)
}

// GenerateOwner emite un token con permiso de escritura aunque la demo sea de solo lectura.
func (m *Manager) GenerateOwner(userID uuid.UUID, role string) (string, error) {
	return m.generate(userID, role, true)
}

func (m *Manager) generate(userID uuid.UUID, role string, rw bool) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID: userID,
		Role:   role,
		RW:     rw,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", fmt.Errorf("firmar token: %w", err)
	}
	return signed, nil
}

// Parse valida la firma y la expiración del token y devuelve sus claims.
func (m *Manager) Parse(tokenString string) (*Claims, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inesperado: %v", t.Header["alg"])
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("token inválido: %w", err)
	}
	return claims, nil
}
