package usuarios

type LoginRequest struct {
	Email string `json:"email"`
	Senha string `json:"senha"`
}

type UsuarioResponse struct {
	ID      string `json:"id"`
	Nome    string `json:"nome"`
	Email   string `json:"email"`
	Perfil  string `json:"perfil"`
	FotoUrl string `json:"fotoUrl"`
}

// UsuarioStaffResponse é usado no dropdown de responsáveis dos chamados.
type UsuarioStaffResponse struct {
	ID   string `json:"id"`
	Nome string `json:"nome"`
}

type AtualizarFotoRequest struct {
	FotoUrl string `json:"fotoUrl"`
}