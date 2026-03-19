package alunos

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

// ListarHandler — GET /alunos?nome=&codigo=&situacao=&limit=&offset=
func ListarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		limit, _ := strconv.Atoi(q.Get("limit"))
		offset, _ := strconv.Atoi(q.Get("offset"))
		if limit <= 0 || limit > 100 {
			limit = 20
		}

		f := FiltrosListar{
			Nome:     q.Get("nome"),
			Codigo:   q.Get("codigo"),
			Situacao: q.Get("situacao"),
			Limit:    limit,
			Offset:   offset,
		}

		lista, total, err := Listar(r.Context(), db, f)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao listar alunos")
			return
		}
		responderJSON(w, http.StatusOK, ListaAlunosResponse{Items: lista, Count: total})
	}
}

// ContarHandler — GET /alunos/count?situacao=Ativo
func ContarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		situacao := r.URL.Query().Get("situacao")
		var total int
		var err error

		if situacao == "Ativo" || situacao == "" {
			total, err = ContarAtivos(r.Context(), db)
		} else {
			// para outros status futuros, reutiliza Listar com limit=1
			_, total, err = Listar(r.Context(), db, FiltrosListar{Situacao: situacao, Limit: 1})
		}

		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao contar alunos")
			return
		}
		responderJSON(w, http.StatusOK, ContadorResponse{Total: total})
	}
}

// CriarHandler — POST /alunos
func CriarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req AlunoRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			responderErro(w, http.StatusBadRequest, "corpo da requisição inválido")
			return
		}
		defer r.Body.Close()

		if strings.TrimSpace(req.Nome) == "" || strings.TrimSpace(req.Codigo) == "" {
			responderErro(w, http.StatusUnprocessableEntity, "nome e código são obrigatórios")
			return
		}

		aluno, err := Criar(r.Context(), db, req)
		if err != nil {
			// Código duplicado (unique violation)
			if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
				responderErro(w, http.StatusConflict, "já existe um aluno com esse código")
				return
			}
			responderErro(w, http.StatusInternalServerError, "erro ao criar aluno")
			return
		}
		responderJSON(w, http.StatusCreated, aluno)
	}
}

// ObterHandler — GET /alunos/{id}
func ObterHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id"))
		if err != nil || id <= 0 {
			responderErro(w, http.StatusBadRequest, "id inválido")
			return
		}

		aluno, err := ObterPorID(r.Context(), db, id)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao buscar aluno")
			return
		}
		if aluno == nil {
			responderErro(w, http.StatusNotFound, "aluno não encontrado")
			return
		}
		responderJSON(w, http.StatusOK, aluno)
	}
}

// AtualizarFotoHandler — PATCH /alunos/{id}/foto
func AtualizarFotoHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id"))
		if err != nil || id <= 0 {
			responderErro(w, http.StatusBadRequest, "id inválido")
			return
		}

		var req AtualizarFotoRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			responderErro(w, http.StatusBadRequest, "dados inválidos")
			return
		}
		if req.FotoUrl == "" {
			responderErro(w, http.StatusBadRequest, "fotoUrl é obrigatório")
			return
		}

		if err := AtualizarFoto(r.Context(), db, id, req.FotoUrl); err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao atualizar foto")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"fotoUrl": req.FotoUrl})
	}
}
