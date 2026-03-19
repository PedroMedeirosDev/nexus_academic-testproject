package usuarios

import (
"context"
"database/sql"
"errors"
)

// ObterPorEmail busca os dados do usuario. Retorna o usuario, a senha salva e o erro original.
func ObterPorEmail(ctx context.Context, db *sql.DB, email string) (*UsuarioResponse, string, error) {
var user UsuarioResponse
var senhaSalva string

query := `SELECT id, nome, email, senha, perfil, COALESCE(foto_url, '') FROM usuarios WHERE email = $1`

err := db.QueryRowContext(ctx, query, email).Scan(&user.ID, &user.Nome, &user.Email, &senhaSalva, &user.Perfil, &user.FotoUrl)
if err != nil {
if errors.Is(err, sql.ErrNoRows) {
return nil, "", nil
}
return nil, "", err
}

return &user, senhaSalva, nil
}

// ListarStaff retorna todos os usuarios com perfil 'staff' (possiveis responsaveis).
func ListarStaff(ctx context.Context, db *sql.DB) ([]UsuarioStaffResponse, error) {
rows, err := db.QueryContext(ctx,
`SELECT id, nome FROM usuarios WHERE perfil = 'staff' ORDER BY nome`)
if err != nil {
return nil, err
}
defer rows.Close()

lista := []UsuarioStaffResponse{}
for rows.Next() {
var u UsuarioStaffResponse
if err := rows.Scan(&u.ID, &u.Nome); err != nil {
return nil, err
}
lista = append(lista, u)
}
return lista, rows.Err()
}

// AtualizarFoto persiste a URL publica da foto de perfil do usuario.
func AtualizarFoto(ctx context.Context, db *sql.DB, id, fotoUrl string) error {
_, err := db.ExecContext(ctx,
`UPDATE usuarios SET foto_url = $1, atualizado_em = NOW() WHERE id = $2`,
fotoUrl, id)
return err
}