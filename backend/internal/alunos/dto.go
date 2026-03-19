package alunos

// AlunoRequest é o payload de criação/atualização.
type AlunoRequest struct {
	Nome           string `json:"nome"`
	Codigo         string `json:"codigo"`
	CPF            string `json:"cpf"`
	DataNascimento string `json:"dataNascimento"` // "YYYY-MM-DD" ou ""
	Situacao       string `json:"situacao"`
}

// AlunoResponse é o payload devolvido ao frontend.
type AlunoResponse struct {
	ID             int    `json:"id"`
	Nome           string `json:"nome"`
	Codigo         string `json:"codigo"`
	CPF            string `json:"cpf"`
	DataNascimento string `json:"dataNascimento"` // "YYYY-MM-DD" ou ""
	Situacao       string `json:"situacao"`
}

// ListaAlunosResponse encapsula paginação.
type ListaAlunosResponse struct {
	Items []AlunoResponse `json:"items"`
	Count int             `json:"count"`
}

// ContadorResponse retorna um único total.
type ContadorResponse struct {
	Total int `json:"total"`
}
