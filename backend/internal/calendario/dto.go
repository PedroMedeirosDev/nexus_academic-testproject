package calendario

// EventoRequest é o payload recebido nas operações de criação/atualização.
type EventoRequest struct {
	Titulo     string `json:"titulo"`
	Descricao  string `json:"descricao"`
	Data       string `json:"data"`       // "YYYY-MM-DD"
	HoraInicio string `json:"horaInicio"` // "HH:MM" ou ""
	HoraFim    string `json:"horaFim"`    // "HH:MM" ou ""
	DiaInteiro bool   `json:"diaInteiro"`
}

// EventoResponse é o payload devolvido ao frontend.
type EventoResponse struct {
	ID         int    `json:"id"`
	Titulo     string `json:"titulo"`
	Descricao  string `json:"descricao"`
	Data       string `json:"data"`       // "YYYY-MM-DD"
	HoraInicio string `json:"horaInicio"` // "HH:MM" ou ""
	HoraFim    string `json:"horaFim"`    // "HH:MM" ou ""
	DiaInteiro bool   `json:"diaInteiro"`
}

// ListaEventosResponse encapsula paginação.
type ListaEventosResponse struct {
	Items []EventoResponse `json:"items"`
	Count int              `json:"count"`
}
