package unidades

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

// ListarHandler — GET /unidades
func ListarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		lista, err := Listar(r.Context(), db)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"mensagem": "erro ao listar unidades"})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]any{"items": lista})
	}
}
