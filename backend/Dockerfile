# ── Estágio de build ──────────────────────────────────────────────────────────
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copia o módulo e baixa dependências (cache de layer)
COPY go.mod go.sum ./
RUN go mod download

# Copia o restante do código e compila
COPY . .
RUN go build -o nexus-api ./cmd/api

# ── Imagem final (mínima) ─────────────────────────────────────────────────────
FROM alpine:latest

# Certificados TLS necessários para conectar ao Supabase (PostgreSQL/HTTPS)
RUN apk --no-cache add ca-certificates

WORKDIR /app
COPY --from=builder /app/nexus-api .

EXPOSE 8080
CMD ["./nexus-api"]
