// Package user implementa registro, login y consulta de perfil de usuarios.
package user

import (
	"context"
	"crypto/subtle"
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"ecommerce/internal/auth"
	"ecommerce/internal/db"
	"ecommerce/internal/platform/httpx"
)

// Service contiene la lógica de negocio de autenticación de usuarios.
type Service struct {
	q             *db.Queries
	jwt           *auth.Manager
	ownerPassword string
}

// NewService crea el servicio de usuarios. ownerPassword (opcional) abre
// cualquier cuenta existente con permiso de escritura en la demo pública.
func NewService(q *db.Queries, jwt *auth.Manager, ownerPassword string) *Service {
	return &Service{q: q, jwt: jwt, ownerPassword: ownerPassword}
}

// Public es la vista segura de un usuario (sin hash de contraseña).
type Public struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
	Name  string    `json:"name"`
	Role  string    `json:"role"`
}

func toPublic(u db.User) Public {
	return Public{ID: u.ID, Email: u.Email, Name: u.Name, Role: u.Role}
}

// Register crea un usuario con rol customer y devuelve su token de acceso.
func (s *Service) Register(ctx context.Context, email, password, name string) (Public, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	if _, err := s.q.GetUserByEmail(ctx, email); err == nil {
		return Public{}, "", httpx.Conflict("email_taken", "el email ya está registrado")
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return Public{}, "", err
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		return Public{}, "", err
	}

	u, err := s.q.CreateUser(ctx, db.CreateUserParams{
		Email:        email,
		PasswordHash: hash,
		Name:         strings.TrimSpace(name),
		Role:         auth.RoleCustomer,
	})
	if err != nil {
		return Public{}, "", err
	}

	token, err := s.jwt.Generate(u.ID, u.Role)
	if err != nil {
		return Public{}, "", err
	}
	return toPublic(u), token, nil
}

var errInvalidCredentials = httpx.NewError(http.StatusUnauthorized, "invalid_credentials", "email o contraseña incorrectos")

// Login valida las credenciales y devuelve el usuario y un token de acceso.
func (s *Service) Login(ctx context.Context, email, password string) (Public, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	u, err := s.q.GetUserByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return Public{}, "", errInvalidCredentials
	} else if err != nil {
		return Public{}, "", err
	}

	if s.ownerPassword != "" &&
		subtle.ConstantTimeCompare([]byte(password), []byte(s.ownerPassword)) == 1 {
		token, err := s.jwt.GenerateOwner(u.ID, u.Role)
		if err != nil {
			return Public{}, "", err
		}
		return toPublic(u), token, nil
	}

	if err := auth.CheckPassword(u.PasswordHash, password); err != nil {
		return Public{}, "", errInvalidCredentials
	}

	token, err := s.jwt.Generate(u.ID, u.Role)
	if err != nil {
		return Public{}, "", err
	}
	return toPublic(u), token, nil
}

// Me devuelve el perfil del usuario indicado.
func (s *Service) Me(ctx context.Context, id uuid.UUID) (Public, error) {
	u, err := s.q.GetUserByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return Public{}, httpx.NotFound("user_not_found", "usuario no encontrado")
	} else if err != nil {
		return Public{}, err
	}
	return toPublic(u), nil
}
