package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jwt"
)

type contextKey string

// UserIDKey é a chave usada para armazenar o UUID do usuário no contexto da requisição.
const UserIDKey contextKey = "user_id"

var (
	jwksCache jwk.Set
	jwksMu    sync.RWMutex
	jwksReady bool
)

// initJWKS busca as chaves públicas do Supabase via JWKS.
// Suporta ECC (P-256 / ES256) e HS256 legado.
func initJWKS() {
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		return // sem URL configurada: modo dev, sem validação
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	set, err := jwk.Fetch(ctx, supabaseURL+"/.well-known/jwks.json")
	if err != nil {
		return
	}

	jwksMu.Lock()
	jwksCache = set
	jwksReady = true
	jwksMu.Unlock()
}

// RequireAuth valida o JWT do Supabase usando a chave pública (JWKS).
// Se SUPABASE_URL não estiver configurada, a validação é ignorada (modo dev).
func RequireAuth(next http.Handler) http.Handler {
	initJWKS()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Preflight CORS — nunca bloquear
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		// POST /login é rota pública (mantida por compatibilidade)
		if r.Method == http.MethodPost && r.URL.Path == "/login" {
			next.ServeHTTP(w, r)
			return
		}

		jwksMu.RLock()
		ready := jwksReady
		keySet := jwksCache
		jwksMu.RUnlock()

		if !ready {
			// JWKS não configurado: modo desenvolvimento, passa sem validar
			next.ServeHTTP(w, r)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"mensagem":"token nao fornecido"}`))
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(
			[]byte(tokenStr),
			jwt.WithKeySet(keySet),
			jwt.WithValidate(true),
		)
		if err != nil || token == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"mensagem":"token invalido ou expirado"}`))
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, token.Subject())
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// UserIDFromContext retorna o UUID do usuário autenticado a partir do contexto.
func UserIDFromContext(ctx context.Context) string {
	id, _ := ctx.Value(UserIDKey).(string)
	return id
}
