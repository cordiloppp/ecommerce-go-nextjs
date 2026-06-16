// Package auth implementa hashing de contraseñas, emisión/validación de JWT
// y middlewares de autorización.
package auth

import "golang.org/x/crypto/bcrypt"

// HashPassword devuelve el hash bcrypt de una contraseña en texto plano.
func HashPassword(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// CheckPassword compara una contraseña en texto plano con su hash bcrypt.
// Devuelve nil si coinciden.
func CheckPassword(hash, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
}
