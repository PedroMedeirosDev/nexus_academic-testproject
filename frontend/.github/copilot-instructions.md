# Instruções para o GitHub Copilot

## Idioma

sempre responder em **português brasileiro (pt-BR)**, incluindo explicações, resumos, comentários em PRs e mensagens de commit.

## Design System

- Design system definido em `globals.css` (tokens) e `tailwind.config.ts`
- Suporte a tema claro e escuro via `next-themes`
- Apenas classes Tailwind e design tokens - zero CSS inline ou por pagina
- Usar tokens semanticos (`bg-background`, `text-foreground`, etc.) em vez de cores diretas

## Layouts

- Layouts reutilizaveis no App Router (sem repetir header/sidebar por pagina)
- Layouts aninhados para seções com necessidades diferentes (ex: páginas publicas e protegidas)
- Layout global compartilhado para rotas publicas e protegidas, evitando duplicação de estrutura.
- Layouts compartilhados ficam em `src/shared/layouts/`
- `app/layout.tsx` — root: `QueryProvider` + `ToastProvider` (layout global para toda o app)
- `app/(auth)/layout.tsx` — passthrough (sem auth)
- `app/(protected)/layout.tsx` — wraps com `AuthProvider`

## Componentes

- Componentes compartilhados em `src/shared/components/`
- Cada secao da UI em seu proprio componente
- `app/` e thin layer: cada `page.tsx` so importa o componente do dominio e renderiza

## DataTable (padrão obrigatório para listas)

**Sempre usar `<DataTable>` de `@/shared/components/DataTable` para exibir listas de registros.** Nunca criar tabelas HTML manuais com `<table><thead><tbody>` nos domínios.

O componente usa [Tabulator v6](https://tabulator.info/) internamente (JS puro, inicializado via `useRef`/`useEffect`). Defaults aplicados automaticamente: `responsiveLayout: "collapse"` (colunas que não cabem ficam acessíveis via toggle) e `layout: "fitColumns"`.

```tsx
import { DataTable } from "@/shared/components/DataTable";
import type { ColumnDefinition } from "@/shared/components/DataTable";

const columns: ColumnDefinition[] = [
  { title: "ID", field: "idFoo", width: 80, sorter: "number" },
  { title: "Nome", field: "nomFoo", sorter: "string" },
  {
    title: "Ativo",
    field: "indAtivo",
    width: 100,
    hozAlign: "center",
    formatter: (cell) => {
      const span = document.createElement("span");
      span.textContent = cell.getValue() === "S" ? "Sim" : "Não";
      // inline style — não usar classes Tailwind em formatters do Tabulator
      return span;
    },
  },
];

// Com infinite scroll (padrão para listagens):
<DataTable<MinhaInterface>
  columns={columns}
  data={items}
  loading={loading}
  totalCount={count}
  onCarregarMais={fetchNextPage}
  carregandoMais={isFetchingNextPage}
  onEditar={handleEditar}
  onExcluir={handleExcluir}
  emptyMessage="Nenhum registro."
/>;
```

**Regras importantes:**

- `onEditar`/`onExcluir` recebem o **objeto completo** da linha (tipado via genérico `<T>`)
- Formatters personalizados usam DOM (`document.createElement`) com **inline styles** — não usar classes Tailwind (são purgadas em build)
- Para forçar re-inicialização completa (ex: troca de colunas), usar `key` prop
- Dados são atualizados reativamente (`setData`) sem re-renderizar o Tabulator

### Padrões obrigatórios na implementação interna do Tabulator

Estes padrões estão implementados em `DataTable.tsx` e **devem ser seguidos** se o componente for estendido ou se o Tabulator for usado diretamente em outro lugar:

**1. O `<div>` do Tabulator deve estar sempre no DOM**
Nunca renderizar condicionalmente o elemento baseando-se em `loading`. O Tabulator é inicializado via `useEffect([], [])` que roda uma única vez no mount — se o elemento não existir nesse momento, a tabela nunca é criada. Usar `display:none` em vez de desmontagem:

```tsx
// ✅ Correto — div sempre presente, apenas ocultado
<div ref={ref} style={{ display: loading ? "none" : undefined }} />;

// ❌ Errado — useEffect([], []) roda mas ref.current é null
{
  !loading && <div ref={ref} />;
}
```

**2. Nunca passar `data` no construtor — usar o evento `tableBuilt`**
O construtor do Tabulator é assíncrono. Chamar `setData` antes do `tableBuilt` lança `cannot read 'verticalFillMode' of null`. Os dados devem ser carregados dentro do callback `tableBuilt`, lendo sempre de um `dataRef` (para pegar a versão mais recente):

```tsx
// ✅ Correto
const table = new Tabulator(ref.current, { columns: cols /*, sem data */ });
table.on("tableBuilt", () => {
  if (destroyed) return;
  table.setData(dataRef.current); // dataRef sempre atualizado via useEffect([data])
});

// ❌ Errado — pode causar crash se dados chegarem antes do tableBuilt
const table = new Tabulator(ref.current, { data, columns: cols });
```

**3. Usar flag `destroyed` para compatibilidade com React Strict Mode**
Em desenvolvimento, o React Strict Mode executa `mount → cleanup → remount`. O cleanup chama `table.destroy()`, mas callbacks assíncronos do Tabulator (como `tableBuilt`) podem disparar depois disso. A flag local `destroyed` previne `setData` em instâncias já destruídas:

```tsx
let destroyed = false;
const table = new Tabulator(ref.current, { ... });

table.on("tableBuilt", () => {
  if (destroyed) return; // ← guard obrigatório
  table.setData(dataRef.current);
});

return () => {
  destroyed = true; // ← setar antes de destroy()
  table.destroy();
};
```

**4. Usar `builtRef` para atualizações reativas seguras**
Atualizações de dados após a carga inicial (ex: após excluir um registro) chegam via `useEffect([data])`. Este effect pode disparar ao mesmo tempo que a construção assíncrona — o `builtRef` garante que `setData` só é chamado após o `tableBuilt`:

```tsx
const builtRef = useRef(false);

table.on("tableBuilt", () => {
  builtRef.current = true; // libera o useEffect([data])
  table.setData(dataRef.current);
});

// Atualização reativa — só se a tabela já está pronta
useEffect(() => {
  if (tableRef.current && builtRef.current) {
    tableRef.current.setData(data);
  }
}, [data]);
```

### Infinite Scroll (padrão obrigatório para listagens)

**Todo `<DataTable>` de listagem deve usar infinite scroll server-side** em vez de paginação local. O componente suporta nativamente via props:

| Prop             | Tipo         | Descrição                                                                         |
| ---------------- | ------------ | --------------------------------------------------------------------------------- |
| `totalCount`     | `number`     | Total de registros retornado pelo backend (`count` da `RespostaPaginada`)         |
| `onCarregarMais` | `() => void` | Callback para buscar a próxima página (via `fetchNextPage` do `useInfiniteQuery`) |
| `carregandoMais` | `boolean`    | `true` enquanto a próxima página está sendo carregada (`isFetchingNextPage`)      |

Quando `onCarregarMais` é fornecido, o DataTable aplica `height: "500px"` automaticamente (overridável via `options`) e detecta scroll perto do final para disparar a carga. Novos registros são **adicionados** sem resetar a posição de scroll.

**Hook padrão — `useInfiniteQuery`:**

```ts
import { useInfiniteQuery } from "@tanstack/react-query";

export function useFoos(limit = 20) {
  const result = useInfiniteQuery({
    queryKey: ["foos", limit],
    queryFn: ({ pageParam = 0 }) => fooService.listar(limit, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return loaded < lastPage.count ? loaded : undefined;
    },
  });

  return {
    items: result.data?.pages.flatMap((p) => p.items) ?? [],
    count: result.data?.pages[0]?.count ?? 0,
    isLoading: result.isLoading,
    isError: result.isError,
    isFetchingNextPage: result.isFetchingNextPage,
    hasNextPage: result.hasNextPage ?? false,
    carregarMais: result.fetchNextPage,
  };
}
```

**Uso no componente de lista:**

```tsx
const {
  items,
  count,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  carregarMais,
} = useFoos();

<DataTable<Foo>
  columns={columns}
  data={items}
  loading={isLoading}
  totalCount={count}
  onCarregarMais={() => {
    if (hasNextPage) carregarMais();
  }}
  carregandoMais={isFetchingNextPage}
  onEditar={handleEditar}
/>;
```

> **Quando NÃO usar infinite scroll:** apenas para tabelas pequenas e estáticas (ex: até ~50 registros que vêm de uma vez). Nesses casos, omitir `totalCount`/`onCarregarMais` e os dados são carregados normalmente via `setData`.

### Ordenação Server-Side (padrão obrigatório)

**Toda ordenação do `<DataTable>` deve ser server-side.** O Tabulator opera com `sortMode: "remote"` — ao clicar no cabeçalho da coluna, o componente **não** ordena os dados localmente. Em vez disso, propaga `sortField` e `sortDir` ("asc" | "desc") via callback `onSort`, que deve atualizar o filtro/query para rebuscar os dados já ordenados do backend.

| Prop     | Tipo                                            | Descrição                                        |
| -------- | ----------------------------------------------- | ------------------------------------------------ |
| `onSort` | `(field: string, dir: "asc" \| "desc") => void` | Callback disparado ao clicar em coluna ordenável |

**No backend**, o endpoint de listagem aceita `sortField` e `sortDir` como query params. Uma **whitelist de colunas** no service valida o campo recebido (previne SQL injection) e monta o `ORDER BY` dinâmico. Se o campo não estiver na whitelist ou não for informado, usa a ordenação padrão do endpoint.

**Quando NÃO usar ordenação server-side:** apenas para tabelas pequenas e estáticas (até ~50 registros carregados de uma vez sem infinite scroll). Nesses casos, omitir `onSort` e o Tabulator ordenará localmente como padrão.

## Navegação — Rotas Dedicadas (padrão obrigatório)

**Nunca usar estado React (`useState`) para alternar entre telas** (ex: lista ↔ formulário, lista ↔ detalhe). Cada tela deve ter sua própria rota no App Router.

Padrão para CRUD com lista + formulário:

```
app/(protected)/{dominio}/
  page.tsx              → thin layer → ListPage (lista)
  novo/
    page.tsx            → thin layer → FormPage passando id={null}
  [id]/
    page.tsx            → thin layer → FormPage passando id do param
```

O componente `FormPage` no domínio recebe o `id` e gerencia navegação via `useRouter`:

```tsx
// domains/.../components/XxxFormPage.tsx
"use client";
import { useRouter } from "next/navigation";
import { XxxForm } from "./XxxForm";

export function XxxFormPage({ id }: { id: number | null }) {
  const router = useRouter();
  return (
    <XxxForm
      id={id}
      onSalvar={() => router.push("/rota/da/lista")}
      onCancelar={() => router.back()}
    />
  );
}
```

Benefícios exigidos por este padrão:

- Botão "voltar" do browser funciona corretamente
- Deep linking e compartilhamento de URL
- Histórico de navegação correto

## Formulários — Modo Criação vs Edição

O modo do formulário é determinado exclusivamente pelo `id` recebido:

- **`id === null` ou `id === 0`** → modo criação (registro ainda não existe no banco)
- **`id > 0`** → modo edição (registro existente)

**Nunca criar uma variável separada** (ex: `modo`, `isNovo`, `isCriando`) para controlar isso — usar `id` diretamente. O registro só deve ser criado no backend no primeiro **salvar**, nunca ao abrir o formulário. Após a criação, redirecionar para a URL de edição (`/rota/:id`) via `router.replace`.

## Comportamento do Copilot

**OBRIGATÓRIO**: Antes de executar qualquer alteração no código, sempre apresentar um resumo do que será feito e aguardar confirmação do usuário. Isso inclui:

- Quais arquivos serão modificados/criados
- O que será alterado em cada arquivo (resumo breve)
- Justificativa da abordagem escolhida (se houver alternativas)

Só executar após o usuário aprovar ou pedir ajustes.

## Logs Temporários de Debug

Após confirmação de que o problema foi resolvido, remover automaticamente todos os logs temporários adicionados durante a investigação, sem aguardar solicitação do usuário.

## Extração de Métodos (DRY)

Sempre que houver código compartilhado relevante entre funções, extrair um método auxiliar reutilizável — desde que a extração traga clareza e reduza duplicação de forma significativa. Não extrair por extrair: só vale a pena quando o trecho é não-trivial e usado em 2+ lugares.

## Alerta de Qualidade

Sempre que uma sugestão do usuário (ou a própria abordagem considerada pelo Copilot) for uma **gambiarra**, **solução errada**, **ineficiente**, **anti-pattern**, **insegura** ou qualquer variação negativa, **alertar explicitamente** antes de implementar. Explicar por que é problemático e propor a alternativa correta. Nunca implementar silenciosamente uma solução sabidamente ruim.

**Isso se aplica também ao código gerado pelo próprio Copilot.** Antes de gerar qualquer trecho, avaliar se a abordagem é a mais correta — não apenas a mais rápida de implementar. Se existir uma API, função ou padrão melhor disponível, usar a solução idiomática em vez de um workaround.

## Preservar Erros Originais (nunca engolir)

**Nunca substituir um estado de erro por uma mensagem genérica que oculta o problema real.** Em telas que carregam dados do backend, sempre separar explicitamente os estados:

| Estado                        | O que exibir                                                   |
| ----------------------------- | -------------------------------------------------------------- |
| `loading`                     | Spinner / skeleton                                             |
| `error` (ex: 500, rede, etc.) | Mensagem de erro real (`error.message` ou fallback descritivo) |
| Dado `null` **sem erro**      | Mensagem "não encontrado" (o recurso genuinamente não existe)  |

**Nunca** tratar `!dados` como "não encontrado" quando há `error` — são estados diferentes. Se o request falhou, o usuário precisa ver que houve um erro (ex: "Erro ao carregar plano"), não uma mensagem falsa de "não encontrado".

```tsx
// ✅ Correto — estados separados
if (loading) return <Spinner />;
if (error) return <TelaErro mensagem={error} />;
if (!dados) return <TelaNaoEncontrado />;

// ❌ Errado — engole o erro e mostra mensagem enganosa
if (loading) return <Spinner />;
if (!dados) return <TelaNaoEncontrado />; // bug: erro de servidor vira "não encontrado"
```

## Estratégia de Cache com React Query (obrigatório)

Acessos a dados do backend **deve usar React Query segundo a tabela abaixo** (`@tanstack/react-query`). Proibido usar `useState` + `useEffect` para buscar dados da API. Os hooks base ficam em `shared/hooks/` e devem ser usados conforme a categoria do dado:

### Categorias de dados

| Categoria        | Exemplos                                | Hook base              | Comportamento                                                           |
| ---------------- | --------------------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| **Referência**   | contexto da sessão, enums, tipos        | `useQueryReferencia`   | Cache imediato + revalida em background                                 |
| **Mestre**       | templates, alunos, turmas, professores  | `useQueryMestre`       | Cache imediato + revalida em background                                 |
| **Transacional** | lançamentos, notas, frequência, boletos | `useQueryTransacional` | Network-first: sempre busca; cache como fallback **só em erro de rede** |

### Dados de Referência e Mestre — stale-while-revalidate

```ts
// shared/hooks/useQueryReferencia.ts
// shared/hooks/useQueryMestre.ts
import { useQuery } from "@tanstack/react-query";

// Serve cache imediatamente, rebusca em background a cada 30s
// Componente renderiza rápido; atualização é silenciosa
const { data, isLoading } = useQueryReferencia(["contexto-academico"], () =>
  contextoService.obterAcademico(),
);
```

Defaults internos:

- `staleTime: 30_000` (30 segundos)
- `gcTime: Infinity` (nunca descarta da memória enquanto a aba estiver aberta)
- `refetchOnWindowFocus: true`

### Dados Transacionais — network-first com fallback de cache em erro de rede

```ts
// shared/hooks/useQueryTransacional.ts

// Sempre busca o backend antes de renderizar
// Enquanto isFetching === true e não é erro de rede → mostra loading (ignora cache)
// Erro de rede (offline/timeout — sem response HTTP) → usa cache de qualquer idade como fallback
// Erro do servidor (4xx/5xx — response chegou)      → mostra erro, NÃO usa cache
const { data, isLoading, isUsingCache } = useQueryTransacional(
  ["notas", idTurma],
  () => notasService.listar(idTurma),
);
```

Defaults internos:

- `staleTime: 0` (nunca considera o cache válido — sempre rebusca)
- `gcTime: Infinity` (cache nunca é descartado — pode ser necessário como fallback a qualquer momento)
- Lógica customizada: enquanto `isFetching && !isNetworkError` → retorna `isLoading: true` (bloqueia renderização)
- `isNetworkError` = erro sem `response` no objeto (axios sem resposta do servidor)
- Quando `isError && isNetworkError && dataAnterior existe` → retorna `isUsingCache: true` + dados do cache
- Quando `isError && !isNetworkError` (4xx/5xx) → retorna o erro normalmente, sem fallback de cache

### Regras

- **Nunca** usar `useState` + `useEffect` para buscar dados — usar sempre um dos três hooks acima
- A `queryKey` deve incluir **todos os parâmetros** que afetam o resultado (ex: `["turmas", anoLetivo, idEntidade]`)
- Para dados que dependem do contexto de sessão, incluir as variáveis relevantes na key
- Mutations (`POST`, `PUT`, `DELETE`) usam `useMutation` do React Query + `queryClient.invalidateQueries` para invalidar o cache relacionado

### QueryClient — configuração por categoria

O `QueryClient` em `shared/lib/queryClient.ts` define os defaults separados. Não sobrescrever `staleTime` ou `gcTime` individualmente nos hooks dos domínios — usar os hooks base que já aplicam o padrão correto.

## maxLength em Inputs de Texto

**Todo `<input>` ou `<textarea>` vinculado a um campo VARCHAR/NVARCHAR do banco deve obrigatoriamente ter o atributo `maxLength` correspondente ao tamanho da coluna.** Exemplo: coluna `VARCHAR(255)` → `maxLength={255}`. Isso garante que o frontend bloqueie digitação além do limite antes de enviar ao backend, evitando erros de truncamento silencioso ou rejeição pelo banco.

## Mensagens de Erro no Frontend

Mensagens de erro exibidas ao usuário (ex: banners vermelhos, toasts) **DEVEM** ser limpas automaticamente quando o usuário interagir com qualquer input relacionado (trocar seleção, digitar em campo, clicar botão de ação). O erro não pode permanecer visível indefinidamente após a interação. Padrão: chamar `setError(null)` (ou equivalente) nos handlers `onChange`/`onClick` dos inputs do mesmo formulário/seção.

## Diálogos de Confirmação e Alerta (padrão obrigatório)

**Nunca usar `window.confirm()` ou `window.alert()`.** Sempre usar os componentes compartilhados baseados em Radix UI (`@radix-ui/react-alert-dialog`):

| Cenário                                                                 | Componente        | Import                              |
| ----------------------------------------------------------------------- | ----------------- | ----------------------------------- |
| Ação destrutiva / que pede confirmação (2 botões: Cancelar + Confirmar) | `<ConfirmDialog>` | `@/shared/components/ConfirmDialog` |
| Alerta informativo (1 botão: OK)                                        | `<AlertDialog>`   | `@/shared/components/AlertDialog`   |

**Uso do `<ConfirmDialog>`:**

```tsx
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";

const [confirmOpen, setConfirmOpen] = useState(false);

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  titulo="Descartar alterações?"
  descricao="Existem alterações não salvas que serão perdidas."
  textoBotaoConfirmar="Descartar"
  variante="danger" // "primary" (padrão) ou "danger"
  onConfirmar={() => {
    setConfirmOpen(false);
    // ação destrutiva aqui
  }}
/>;
```

**Uso do `<AlertDialog>`:**

```tsx
import { AlertDialog } from "@/shared/components/AlertDialog";

const [alertOpen, setAlertOpen] = useState(false);

<AlertDialog
  open={alertOpen}
  onOpenChange={setAlertOpen
  titulo="Operação concluída"
  descricao="O registro foi salvo com sucesso."
/>;
```

- Ambos respeitam os tokens do design system (`bg-panel`, `text-foreground`, `border-border`, etc.)
- Ambos suportam prop `variante`: `"primary"` (padrão) ou `"danger"`
- O estado `open` é controlado pelo componente pai via `useState`

## Estilização (Frontend)

**NÃO** fazer estilização customizada inline ou com classes utilitárias específicas para dark mode/light mode em componentes de terceiros (ex: react-select, comboboxes, modais de libs). Sempre usar o **tema padrão do sistema** ou do componente. Evitar overrides manuais de cores/estilos que dupliquem o que o tema já fornece.

## Responsividade (Frontend)

A abordagem de responsividade deve ser **mobile-first**. Estilizar primeiro para telas pequenas e usar media queries (ou classes utilitárias como `sm:`, `md:`, `lg:` no Tailwind) para adaptar progressivamente a layouts maiores. Nunca partir do desktop e "esconder" elementos no mobile como solução padrão.

## Route Groups + Autenticação

O projeto usa **Route Groups** do Next.js App Router para separar rotas públicas e protegidas **sem afetar a URL**:

| Route Group   | Layout                 | Proteção                     | Exemplo de URL                         |
| ------------- | ---------------------- | ---------------------------- | -------------------------------------- |
| `(auth)`      | Passthrough (sem auth) | Pública                      | `/login`, `/portal`                    |
| `(protected)` | `AuthProvider`         | Requer cookie `access_token` | `/`, `/academico/...`, `/portal/blogs` |

## Arquitetura por Domínios

Projeto escalável. A organização segue separação entre **rotas** (`app/`) e **lógica de domínio** (`domains/`):

```
src/
├── app/                          # Apenas rotas (thin layer)
│   ├── layout.tsx                # Root: QueryProvider + ToastProvider
│   ├── globals.css
│   ├── (auth)/                   # Rotas públicas (sem AuthProvider)
│   │   ├── layout.tsx
│   │   └── login/page.tsx
│   └── (protected)/              # Rotas protegidas (com AuthProvider)
│       ├── layout.tsx
│       └── page.tsx              # Dashboard
│
├── domains/                      # Lógica de negócio por domínio
│   └── auth/
│       └── login/
│           ├── components/       # LoginPage.tsx
│           ├── hooks/            # useLogin.ts
│           └── services/         # loginService.ts
│
├── shared/                       # Código compartilhado entre domínios
│   ├── components/               # Button, Modal, DataTable, Form...
│   ├── hooks/                    # useAuth, useQueryMestre, useQueryReferencia...
│   ├── lib/                      # queryClient
│   ├── services/                 # apiClient (axios/fetch configurado)
│   ├── types/                    # Tipos globais (User, Session, ApiResponse)
│   ├── utils/                    # Formatadores, validadores
│   └── layouts/                  # Layouts reutilizáveis (sidebar, navbar)
```

## Princípios

- **`app/` é thin**: Cada `page.tsx` só importa o componente do domínio e o renderiza. Zero lógica ali.
- **`domains/` é o coração**: Cada domínio é autocontido com components, hooks, services e types.
- **`shared/` é o kit**: Componentes genéricos, hooks utilitários, API client.
- **Escalável**: Adicionar domínio novo = criar pasta em `domains/` + rota em `app/(protected)/`.

## Exemplo de page.tsx (thin)

```tsx
// src/app/(protected)/sistema/modulos/page.tsx
import { ModulosPage } from "@/domains/sistema/modulos/components/ModulosPage";
export default function Page() {
  return <ModulosPage />;
}
```

## Exemplo de componente de domínio

```tsx
// src/domains/sistema/modulos/components/ModulosPage.tsx
"use client";
import { useModulos } from "../hooks/useModulos";
import { DataTable } from "@/shared/components/DataTable";
// ... componente completo aqui
```
