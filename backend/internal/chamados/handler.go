package chamados

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

var situacoesValidas = map[string]bool{
	"Aberto": true, "Em andamento": true, "Resolvido": true, "Fechado": true,
}

var prioridadesValidas = map[string]bool{
	"Urgente": true, "Alta": true, "Normal": true, "Baixa": true,
}

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

func validarChamado(req ChamadoRequest) string {
	if strings.TrimSpace(req.Assunto) == "" {
		return "assunto é obrigatório"
	}
	if strings.TrimSpace(req.Solicitante) == "" {
		return "solicitante é obrigatório"
	}
	if strings.TrimSpace(req.Responsavel) == "" {
		return "responsável é obrigatório"
	}
	if strings.TrimSpace(req.Descricao) == "" {
		return "descrição é obrigatória"
	}
	if req.Situacao != "" && !situacoesValidas[req.Situacao] {
		return "situacao inválida"
	}
	if req.Prioridade != "" && !prioridadesValidas[req.Prioridade] {
		return "prioridade inválida"
	}
	return ""
}

// ListarHandler — GET /suporte/chamados?num=&assunto=&solicitante=&responsavel=&unidade_id=&limit=20&offset=0
func ListarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()

		limit, _ := strconv.Atoi(q.Get("limit"))
		offset, _ := strconv.Atoi(q.Get("offset"))
		if limit <= 0 || limit > 100 {
			limit = 20
		}
		if offset < 0 {
			offset = 0
		}
		unidadeID, _ := strconv.Atoi(q.Get("unidade_id"))

		f := Filtros{
			UnidadeID:   unidadeID,
			Num:         q.Get("num"),
			Assunto:     q.Get("assunto"),
			Solicitante: q.Get("solicitante"),
			Responsavel: q.Get("responsavel"),
			Situacao:    q.Get("situacao"),
			OrderBy:     q.Get("order_by"),
			OrderDir:    q.Get("order_dir"),
			Limit:       limit,
			Offset:      offset,
		}

		lista, total, err := Listar(r.Context(), db, f)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao listar chamados")
			return
		}

		responderJSON(w, http.StatusOK, ListaChamadosResponse{Items: lista, Count: total})
	}
}

// CriarHandler — POST /suporte/chamados
func CriarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ChamadoRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			responderErro(w, http.StatusBadRequest, "corpo da requisição inválido")
			return
		}
		defer r.Body.Close()

		if req.Situacao == "" {
			req.Situacao = "Aberto"
		}
		if req.Prioridade == "" {
			req.Prioridade = "Normal"
		}
		if req.UnidadeID <= 0 {
			req.UnidadeID = 1
		}

		if msg := validarChamado(req); msg != "" {
			responderErro(w, http.StatusUnprocessableEntity, msg)
			return
		}

		chamado, err := Criar(r.Context(), db, req)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao criar chamado")
			return
		}

		responderJSON(w, http.StatusCreated, chamado)
	}
}

// ObterHandler — GET /suporte/chamados/{id}
func ObterHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id"))
		if err != nil || id <= 0 {
			responderErro(w, http.StatusBadRequest, "id inválido")
			return
		}

		lista, _, err := Listar(r.Context(), db, Filtros{ID: id, Limit: 1, Offset: 0})
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao obter chamado")
			return
		}
		if len(lista) == 0 {
			responderErro(w, http.StatusNotFound, "chamado não encontrado")
			return
		}
		responderJSON(w, http.StatusOK, lista[0])
	}
}

// AtualizarHandler — PUT /suporte/chamados/{id}
func AtualizarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id"))
		if err != nil || id <= 0 {
			responderErro(w, http.StatusBadRequest, "id inválido")
			return
		}

		var req ChamadoRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			responderErro(w, http.StatusBadRequest, "corpo da requisição inválido")
			return
		}
		defer r.Body.Close()

		if msg := validarChamado(req); msg != "" {
			responderErro(w, http.StatusUnprocessableEntity, msg)
			return
		}

		chamado, err := Atualizar(r.Context(), db, id, req)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao atualizar chamado")
			return
		}
		if chamado == nil {
			responderErro(w, http.StatusNotFound, "chamado não encontrado")
			return
		}

		responderJSON(w, http.StatusOK, chamado)
	}
}

// ExcluirHandler — DELETE /suporte/chamados/{id}
func ExcluirHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id"))
		if err != nil || id <= 0 {
			responderErro(w, http.StatusBadRequest, "id inválido")
			return
		}

		encontrado, err := Excluir(r.Context(), db, id)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao excluir chamado")
			return
		}
		if !encontrado {
			responderErro(w, http.StatusNotFound, "chamado não encontrado")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// ListarHistoricoHandler — GET /suporte/chamados/{id}/historico
func ListarHistoricoHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idChamado, err := strconv.Atoi(r.PathValue("id"))
		if err != nil || idChamado <= 0 {
			responderErro(w, http.StatusBadRequest, "id inválido")
			return
		}

		lista, err := ListarHistorico(r.Context(), db, idChamado)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao listar histórico")
			return
		}

		responderJSON(w, http.StatusOK, map[string]any{"items": lista, "count": len(lista)})
	}
}

// AdicionarHistoricoHandler — POST /suporte/chamados/{id}/historico
func AdicionarHistoricoHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idChamado, err := strconv.Atoi(r.PathValue("id"))
		if err != nil || idChamado <= 0 {
			responderErro(w, http.StatusBadRequest, "id inválido")
			return
		}

		var req HistoricoRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			responderErro(w, http.StatusBadRequest, "corpo da requisição inválido")
			return
		}
		defer r.Body.Close()

		if strings.TrimSpace(req.Autor) == "" || strings.TrimSpace(req.Mensagem) == "" {
			responderErro(w, http.StatusUnprocessableEntity, "autor e mensagem são obrigatórios")
			return
		}

		item, err := AdicionarHistorico(r.Context(), db, idChamado, req)
		if err != nil {
			responderErro(w, http.StatusInternalServerError, "erro ao adicionar histórico")
			return
		}

		responderJSON(w, http.StatusCreated, item)
	}
}
