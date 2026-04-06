package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"nexus-academico/internal/alunos"
	"nexus-academico/internal/calendario"
	"nexus-academico/internal/chamados"
	"nexus-academico/internal/middleware"
	"nexus-academico/internal/unidades"
	"nexus-academico/internal/usuarios"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// carregarOrigens monta o mapa de origens permitidas para CORS.
// Inclui os padrões de desenvolvimento e qualquer origem extra definida
// na variável de ambiente CORS_ORIGINS (separadas por vírgula).
func carregarOrigens() map[string]bool {
	m := map[string]bool{
		"http://localhost:3000": true,
		"http://localhost:3001": true,
	}
	if extra := os.Getenv("CORS_ORIGINS"); extra != "" {
		for _, o := range strings.Split(extra, ",") {
			if o = strings.TrimSpace(o); o != "" {
				m[o] = true
			}
		}
	}
	return m
}

// aplicarCORS envolve o handler principal com os cabeçalhos de CORS e trata preflight OPTIONS.
func aplicarCORS(proximo http.Handler) http.Handler {
	origens := carregarOrigens()
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origem := r.Header.Get("Origin")
		if origens[origem] {
			w.Header().Set("Access-Control-Allow-Origin", origem)
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		proximo.ServeHTTP(w, r)
	})
}

func carregarEnv() {
	paths := []string{".env", "../.env", "../../.env"}
	for _, path := range paths {
		if err := godotenv.Load(path); err == nil {
			return
		}
	}
	// Em produção as variáveis vêm do servidor (Railway/Render) — sem .env é normal
	log.Println("⚠️  Arquivo .env não encontrado — usando variáveis de ambiente do sistema")
}

func main() {
	// 1. Carregar variaveis de ambiente, independente do diretorio de execucao
	carregarEnv()

	// 2. Configurar conexão com o Supabase
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Não foi possível conectar ao banco:", err)
	}
	fmt.Println("🚀 Nexus Acadêmico: Banco de dados conectado!")

	// 3. Registro de Rotas (Go 1.22 — método + caminho)
	mux := http.NewServeMux()

	// Autenticação e usuários
	mux.HandleFunc("POST /login", usuarios.LoginHandler(db))
	mux.HandleFunc("GET /usuarios", usuarios.ListarHandler(db))
	mux.HandleFunc("PATCH /usuarios/{id}/foto", usuarios.AtualizarFotoHandler(db))

	// Unidades
	mux.HandleFunc("GET /unidades", unidades.ListarHandler(db))

	// Alunos
	mux.HandleFunc("GET /alunos", alunos.ListarHandler(db))
	mux.HandleFunc("GET /alunos/count", alunos.ContarHandler(db))
	mux.HandleFunc("GET /alunos/{id}", alunos.ObterHandler(db))
	mux.HandleFunc("POST /alunos", alunos.CriarHandler(db))
	mux.HandleFunc("PATCH /alunos/{id}/foto", alunos.AtualizarFotoHandler(db))

	// Calendário
	mux.HandleFunc("GET /calendario/eventos", calendario.ListarHandler(db))
	mux.HandleFunc("POST /calendario/eventos", calendario.CriarHandler(db))
	mux.HandleFunc("PUT /calendario/eventos/{id}", calendario.AtualizarHandler(db))
	mux.HandleFunc("DELETE /calendario/eventos/{id}", calendario.ExcluirHandler(db))

	// Chamados de suporte
	mux.HandleFunc("GET /suporte/chamados", chamados.ListarHandler(db))
	mux.HandleFunc("POST /suporte/chamados", chamados.CriarHandler(db))
	mux.HandleFunc("GET /suporte/chamados/{id}", chamados.ObterHandler(db))
	mux.HandleFunc("PUT /suporte/chamados/{id}", chamados.AtualizarHandler(db))
	mux.HandleFunc("DELETE /suporte/chamados/{id}", chamados.ExcluirHandler(db))
	mux.HandleFunc("GET /suporte/chamados/{id}/historico", chamados.ListarHistoricoHandler(db))
	mux.HandleFunc("POST /suporte/chamados/{id}/historico", chamados.AdicionarHistoricoHandler(db))

	// 4. Iniciar o servidor (CORS + JWT Auth aplicados globalmente)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8090"
	}

	fmt.Printf("📡 Servidor rodando em http://localhost:%s\n", port)
	handler := aplicarCORS(middleware.RequireAuth(mux))
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}