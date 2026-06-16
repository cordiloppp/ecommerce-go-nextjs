// Package migrations expone los ficheros SQL de migración embebidos en el binario.
package migrations

import "embed"

// FS contiene todos los ficheros *.sql de migración, ordenados por nombre.
//
//go:embed *.sql
var FS embed.FS
