package product

import "testing"

func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"Teclado Mecánico RGB":   "teclado-mecanico-rgb",
		"Ratón Gaming 16000 DPI": "raton-gaming-16000-dpi",
		"Altavoz Portátil":       "altavoz-portatil",
		"  Monitor 27\" 144Hz  ": "monitor-27-144hz",
		"Pingüino Año":           "pinguino-ano",
	}
	for in, want := range cases {
		if got := Slugify(in); got != want {
			t.Errorf("Slugify(%q) = %q, se esperaba %q", in, got, want)
		}
	}
}
