package calendario

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

func responderErro(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"mensagem": msg})
}

func responderJSON(w http.ResponseWriter, status int, dado any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(dado)
}

// ListarHandler — GET /calendario/eventos?mes=3&ano=2026
func ListarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		mes, err1 := strconv.Atoi(r.URL.Query().Get("mes"))
		ano, err2 := strconv.Atoi(r.URL.Query().Get("ano"))
		if err1 != nil || err2 != nil || mes < 1 || mes > 12 || ano < 2000 {
			responderErro(w, http.StatusBadRequest, "parâmetros mes e ano são obrigatórios e devem ser válidos")
			return
		}

		eventos, err := Listar(r.Context(), db, mes, ano)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao listar eventos")
			return
		}

		responderJSON(w, http.StatusOK, ListaEventosResponse{Items: eventos, Count: len(eventos)})
	}
}

// CriarHandler — POST /calendario/eventos
func CriarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req EventoRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			responderErro(w, http.StatusBadRequest, "corpo da requisição inválido")
			return
		}
		defer r.Body.Close()

		if strings.TrimSpace(req.Titulo) == "" || req.Data == "" {
			responderErro(w, http.StatusUnprocessableEntity, "titulo e data são obrigatórios")
			return
		}

		evento, err := Criar(r.Context(), db, req)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao criar evento")
			return
		}

		responderJSON(w, http.StatusCreated, evento)
	}
}

// AtualizarHandler — PUT /calendario/eventos/{id}
func AtualizarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id"))
		if err != nil || id <= 0 {
			responderErro(w, http.StatusBadRequest, "id inválido")
			return
		}

		var req EventoRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			responderErro(w, http.StatusBadRequest, "corpo da requisição inválido")
			return
		}
		defer r.Body.Close()

		if strings.TrimSpace(req.Titulo) == "" || req.Data == "" {
			responderErro(w, http.StatusUnprocessableEntity, "titulo e data são obrigatórios")
			return
		}

		evento, err := Atualizar(r.Context(), db, id, req)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao atualizar evento")
			return
		}
		if evento == nil {
			responderErro(w, http.StatusNotFound, "evento não encontrado")
			return
		}

		responderJSON(w, http.StatusOK, evento)
	}
}

// ExcluirHandler — DELETE /calendario/eventos/{id}
func ExcluirHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id"))
		if err != nil || id <= 0 {
			responderErro(w, http.StatusBadRequest, "id inválido")
			return
		}

		encontrado, err := Excluir(r.Context(), db, id)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao excluir evento")
			return
		}
		if !encontrado {
			responderErro(w, http.StatusNotFound, "evento não encontrado")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
