package usuarios

import (
"database/sql"
"encoding/json"
"net/http"
"strings"
)

type respostaErro struct {
Mensagem string `json:"mensagem"`
}

func responderErro(w http.ResponseWriter, status int, mensagem string) {
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(status)
_ = json.NewEncoder(w).Encode(respostaErro{Mensagem: mensagem})
}

// ListarHandler — GET /usuarios — retorna staff (responsaveis para dropdown)
func ListarHandler(db *sql.DB) http.HandlerFunc {
return func(w http.ResponseWriter, r *http.Request) {
lista, err := ListarStaff(r.Context(), db)
if err != nil {
responderErro(w, http.StatusInternalServerError, "erro ao listar usuarios")
return
}
w.Header().Set("Content-Type", "application/json")
_ = json.NewEncoder(w).Encode(map[string]any{"items": lista})
}
}

func LoginHandler(db *sql.DB) http.HandlerFunc {
return func(w http.ResponseWriter, r *http.Request) {
if r.Method == http.MethodOptions {
w.WriteHeader(http.StatusNoContent)
return
}

if r.Method != http.MethodPost {
responderErro(w, http.StatusMethodNotAllowed, "metodo nao permitido")
return
}

var req LoginRequest

if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
responderErro(w, http.StatusBadRequest, "dados invalidos")
return
}

user, senhaSalva, err := ObterPorEmail(r.Context(), db, req.Email)
if err != nil {
responderErro(w, http.StatusInternalServerError, "erro interno do servidor")
return
}

if user == nil {
responderErro(w, http.StatusUnauthorized, "usuario nao encontrado")
return
}

if req.Senha != senhaSalva {
responderErro(w, http.StatusUnauthorized, "senha incorreta")
return
}

w.Header().Set("Content-Type", "application/json")
_ = json.NewEncoder(w).Encode(user)
}
}

// AtualizarFotoHandler — PATCH /usuarios/{id}/foto
// Recebe { "fotoUrl": "https://..." } e persiste no banco.
func AtualizarFotoHandler(db *sql.DB) http.HandlerFunc {
return func(w http.ResponseWriter, r *http.Request) {
// Extrai {id} do path: /usuarios/{id}/foto
partes := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
// partes = ["usuarios", "{id}", "foto"]
if len(partes) < 3 {
responderErro(w, http.StatusBadRequest, "id invalido")
return
}
id := partes[1]
if id == "" {
responderErro(w, http.StatusBadRequest, "id invalido")
return
}

var req AtualizarFotoRequest
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
responderErro(w, http.StatusBadRequest, "dados invalidos")
return
}
if req.FotoUrl == "" {
responderErro(w, http.StatusBadRequest, "fotoUrl e obrigatorio")
return
}

if err := AtualizarFoto(r.Context(), db, id, req.FotoUrl); err != nil {
responderErro(w, http.StatusInternalServerError, "erro ao atualizar foto")
return
}

w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
_ = json.NewEncoder(w).Encode(map[string]string{"fotoUrl": req.FotoUrl})
}
}