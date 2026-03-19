package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"nexus-academico/internal/alunos"
	"nexus-academico/internal/calendario"
	"nexus-academico/internal/chamados"
	"nexus-academico/internal/usuarios"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// aplicarCORS envolve o handler principal com os cabeçalhos de CORS e trata preflight OPTIONS.
func aplicarCORS(proximo http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		proximo.ServeHTTP(w, r)
	})
}

func carregarEnv() error {
	paths := []string{".env", "../.env", "../../.env"}

	for _, path := range paths {
		if err := godotenv.Load(path); err == nil {
			return nil
		}
	}

	return fmt.Errorf("arquivo .env nao encontrado (tentativas: %v)", paths)
}

func main() {
	// 1. Carregar variaveis de ambiente, independente do diretorio de execucao
	if err := carregarEnv(); err != nil {
		log.Fatal(err)
	}

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
	mux.HandleFunc("PUT /suporte/chamados/{id}", chamados.AtualizarHandler(db))
	mux.HandleFunc("DELETE /suporte/chamados/{id}", chamados.ExcluirHandler(db))
	mux.HandleFunc("GET /suporte/chamados/{id}/historico", chamados.ListarHistoricoHandler(db))
	mux.HandleFunc("POST /suporte/chamados/{id}/historico", chamados.AdicionarHistoricoHandler(db))

	// 4. Iniciar o servidor (CORS aplicado globalmente ao mux)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("📡 Servidor rodando em http://localhost:%s\n", port)
	if err := http.ListenAndServe(":"+port, aplicarCORS(mux)); err != nil {
		log.Fatal(err)
	}
}