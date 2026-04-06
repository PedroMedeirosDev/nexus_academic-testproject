package chamados

// ChamadoRequest é o payload recebido nas operações de criação/atualização.
type ChamadoRequest struct {
	UnidadeID   int    `json:"unidade_id"`
	Assunto     string `json:"assunto"`
	Descricao   string `json:"descricao"`
	Situacao    string `json:"situacao"`
	Prioridade  string `json:"prioridade"`
	Tipo        string `json:"tipo"`
	Setor       string `json:"setor"`
	Solicitante string `json:"solicitante"`
	Responsavel string `json:"responsavel"`
}

// ChamadoResponse é o payload devolvido ao frontend.
type ChamadoResponse struct {
	ID          int    `json:"id"`
	Assunto     string `json:"assunto"`
	Descricao   string `json:"descricao"`
	Situacao    string `json:"situacao"`
	Prioridade  string `json:"prioridade"`
	Tipo        string `json:"tipo"`
	Setor       string `json:"setor"`
	Solicitante string `json:"solicitante"`
	Responsavel string `json:"responsavel"`
	DataHora    string `json:"dataHora"` // "DD/MM/YYYY HH:MM"
	Unidade     string `json:"unidade"`  // sigla da unidade, ex: "CD"
}

// ListaChamadosResponse encapsula paginação.
type ListaChamadosResponse struct {
	Items []ChamadoResponse `json:"items"`
	Count int               `json:"count"`
}

// HistoricoRequest é o payload para adicionar uma mensagem ao histórico.
type HistoricoRequest struct {
	Autor    string `json:"autor"`
	Mensagem string `json:"mensagem"`
}

// HistoricoResponse é o payload devolvido para cada item do histórico.
type HistoricoResponse struct {
	ID       int    `json:"id"`
	Autor    string `json:"autor"`
	Mensagem string `json:"mensagem"`
	Data     string `json:"data"` // "DD/MM/YYYY HH:MM"
}

// Filtros encapsula os parâmetros de busca/paginação da listagem.
type Filtros struct {
	ID          int
	UnidadeID   int
	Num         string
	Assunto     string
	Solicitante string
	Responsavel string
	Limit       int
	Offset      int
}
