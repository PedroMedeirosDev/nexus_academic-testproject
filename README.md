# Nexus Acadêmico — Gestão de Chamados

Sistema web de gerenciamento de chamados de suporte para instituições de ensino. Desenvolvido como projeto de portfólio com stack moderna, integração real com banco de dados e deploy em produção.

🔗 **Demo:** [nexus-academic-testproject.vercel.app](https://nexus-academic-testproject.vercel.app)

---

## Funcionalidades

### Chamados
- Abertura de chamados com campos de assunto, descrição, tipo, setor, prioridade, unidade, solicitante e responsável
- Listagem paginada com carregamento incremental (infinite scroll)
- Filtros por número, assunto, solicitante e responsável
- Edição completa de um chamado existente
- Exclusão com confirmação via toast

### Comentários e Histórico
- Seção de comentários por chamado, identificados por usuário autenticado
- Edição de comentários próprios com marcação de "editado"
- Histórico de alterações rastreado

### Anexos
- Upload de arquivos (imagens, vídeos, PDFs, DOCX) por drag-and-drop ou clique
- Limite de 50 MB por arquivo
- Barra de progresso individual por arquivo durante o envio
- Visualização inline de imagens e vídeos; download para demais formatos
- Exclusão de anexos diretamente na interface
- Armazenamento no Supabase Storage (bucket `chamados-anexos`)

### Dashboard
- Contagem total de chamados em aberto (todos, não apenas os recentes)
- Tabela dos 5 chamados mais recentes com acesso rápido por duplo clique
- Atalho direto para abertura de novo chamado

### UX
- Notificações toast para criação, exclusão e erros (verde/vermelho)
- Autenticação via Supabase Auth com validação de JWT no backend
- Interface responsiva, dark mode nativo

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Estado / Cache | TanStack Query v5 |
| Backend | Go 1.23 — API REST com `net/http` nativo |
| Banco de dados | PostgreSQL via Supabase |
| Autenticação | Supabase Auth (JWT ES256 / JWKS) |
| Armazenamento | Supabase Storage |
| Deploy | Vercel (frontend) · Railway (backend) |

---

## Arquitetura do Backend

O módulo de chamados segue separação estrita por responsabilidade em três camadas:

```
dto.go      → contratos de entrada/saída (structs + json tags)
handler.go  → camada HTTP: leitura de params, validação, resposta
model.go    → acesso ao banco: queries SQL parametrizadas
```

Todos os endpoints são protegidos por middleware de autenticação JWT. As queries usam parâmetros posicionais (`$1`, `$2`…) — sem concatenação de string, sem risco de SQL Injection.

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/suporte/chamados` | Listar com filtros e paginação |
| `POST` | `/suporte/chamados` | Criar chamado |
| `GET` | `/suporte/chamados/:id` | Obter chamado por ID |
| `PUT` | `/suporte/chamados/:id` | Atualizar chamado |
| `DELETE` | `/suporte/chamados/:id` | Excluir chamado |
| `GET` | `/suporte/chamados/:id/historico` | Listar histórico |
| `POST` | `/suporte/chamados/:id/historico` | Adicionar entrada no histórico |

---

## Estrutura relevante do projeto

```
backend/
  cmd/api/main.go              # servidor, rotas, CORS, JWT middleware
  internal/
    chamados/
      dto.go                   # tipos de entrada e saída
      handler.go               # handlers HTTP
      model.go                 # queries ao banco
    middleware/auth.go          # validação JWT via JWKS

frontend/
  src/
    domains/suporte/chamados/
      components/
        ChamadosPage.tsx        # listagem com filtros
        ChamadoFormPage.tsx     # formulário novo/edição
        ComentariosSection.tsx  # comentários + anexos
        UploadArea.tsx          # drag-and-drop com progresso
        AnexoViewer.tsx         # visualização inline
      hooks/useChamados.ts      # TanStack Query (infinite + mutations)
      services/chamadosService.ts
      services/comentariosService.ts
    shared/components/ToastProvider.tsx  # sistema de toast próprio
```