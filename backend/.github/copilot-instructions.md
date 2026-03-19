# Instrucoes para o GitHub Copilot (Backend)

## Idioma

- Sempre responder em portugues brasileiro (pt-BR), incluindo explicacoes, resumos, comentarios em PRs e mensagens de commit.

## Escopo

- Este arquivo vale para o backend Go da API REST.
- Evitar instrucoes de frontend (React, Tailwind, layout, DataTable) neste contexto.

## Comportamento do Copilot

- Antes de executar alteracoes de codigo, sempre apresentar:
  - quais arquivos serao alterados/criados;
  - resumo breve do que sera alterado em cada arquivo;
  - justificativa da abordagem (quando houver alternativa).
- So executar apos aprovacao explicita do usuario.
- Se identificar proposta ruim (gambiarra, anti-pattern, inseguranca, ineficiencia), alertar explicitamente e propor alternativa correta.

## Arquitetura por dominio (padrao)

Cada dominio deve seguir a estrutura:

```text
internal/{dominio}/
  model.go
  dto.go
  service.go
  handler.go
  routes.go
```

Responsabilidades:

- `model.go`: structs de persistencia + mapeamentos + queries pontuais.
- `dto.go`: contratos de request/response (sem detalhes de persistencia).
- `service.go`: regras de negocio, validacoes, transacoes e orquestracao.
- `handler.go`: parse/validacao de entrada HTTP e resposta.
- `routes.go`: registro das rotas do dominio.

## Convencoes de codigo (Go)

- Nomes publicos em portugues (`Listar`, `ObterPorId`, `Criar`, `Atualizar`, `Excluir`).
- Evitar misturar portugues e ingles no mesmo identificador.
- Receber `context.Context` como primeiro parametro em funcoes de servico.
- Nao criar wrappers desnecessarios; preferir codigo simples e idiomatico.
- Extrair metodos auxiliares quando houver duplicacao nao trivial (DRY).

## Padrao de rotas CRUD

- `GET /` -> `Listar()`
- `GET /:id` -> `ObterPorId()`
- `POST /` -> `Criar()`
- `PUT /:id` -> `Atualizar()`
- `DELETE /:id` -> `Excluir()`

## Paginacao obrigatoria em listagens

Todo endpoint de listagem (`GET /`) deve suportar:

- `limit` (default `20`)
- `offset` (default `0`)

Resposta padrao:

```go
type RespostaPaginada[T any] struct {
    Count int `json:"count"`
    Items []T `json:"items"`
}
```

Regras:

- `count` = total sem paginacao.
- `items` = pagina atual.
- Em slices de resposta, inicializar com `make([]T, 0)` para evitar `null` no JSON.

## Banco de dados e SQL

- Nunca usar `SELECT *`; listar colunas explicitamente.
- Sempre usar queries parametrizadas (sem concatenar input do usuario).
- Validar campos de ordenacao/filtro com whitelist quando houver SQL dinamico.
- Preservar erro original do banco; nao transformar todo erro em "nao encontrado".

Padrao correto:

```go
entidade, err := repo.ObterPorId(ctx, id)
if err != nil {
    return nil, err
}
if entidade == nil {
    return nil, ErrNaoEncontrado
}
```

## Tratamento de erros nos handlers

- Toda resposta de erro HTTP (4xx/5xx) deve ser logada com contexto relevante.
- Nao expor dados sensiveis em mensagens de erro (senha, token, connection string, dados de terceiros).
- Para regra de negocio conhecida, retornar erro de negocio de forma clara.
- Para erro tecnico inesperado, retornar mensagem generica ao cliente e log detalhado no servidor.

## Logs e observabilidade

- Usar logs estruturados com contexto (operacao, ids, usuario quando aplicavel).
- Logs de debug custosos devem verificar se debug esta ativo antes de serializar/formata pesado.

Padrao recomendado:

```go
if e := log.Debug(); e.Enabled() {
    e.Str("operacao", "criar_usuario").Msg("entrada validada")
}
```

- Remover logs temporarios de investigacao apos resolver o problema.

## Autenticacao e seguranca

- Nunca armazenar senha em texto puro.
- Sempre armazenar senha com hash bcrypt.
- No login, usar `bcrypt.CompareHashAndPassword`.
- JWT/segredos devem vir de variaveis de ambiente.
- Rate limit e lockout progressivo sao recomendados para endpoint de login.

## Configuracao por ambiente

- Parametros devem vir de env vars (`.env` para desenvolvimento).
- Evitar valores sensiveis hardcoded no codigo.
- Exemplo de variaveis:
  - `SERVER_PORT`
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`

## Banco remoto (sem banco local)

- Preferir banco gerenciado na nuvem (Supabase/Neon/Railway/RDS etc.).
- O backend Go conecta via `DATABASE_URL`.
- Migracoes e seed inicial devem ser versionadas no repositorio.

## Qualidade e testes

- Para cada alteracao de regra de negocio, incluir ou atualizar testes.
- Priorizar testes em service (regras) e handlers (contratos HTTP).
- Se nao for possivel testar localmente, registrar claramente a limitacao.

## Estrutura de pastas (referencia)

```text
backend/
  cmd/
    api/
      main.go
  internal/
    handlers/
    ...dominios
  .env
  go.mod
```

## Registro de rotas

- Novos dominios devem expor `Setup(router, deps...)` em `routes.go`.
- Centralizar composicao de rotas no bootstrap (`cmd/api/main.go` ou arquivo de roteamento principal).
- Evitar duplicacao de middleware por rota quando puder aplicar no grupo.
