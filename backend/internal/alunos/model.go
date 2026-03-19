package alunos

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

const idUnidadePadrao = 1

// FiltrosListar reúne os parâmetros aceitos pelo endpoint de listagem.
type FiltrosListar struct {
	Nome     string
	Codigo   string
	Situacao string
	Limit    int
	Offset   int
}

// Listar retorna alunos paginados com filtros opcionais.
func Listar(ctx context.Context, db *sql.DB, f FiltrosListar) ([]AlunoResponse, int, error) {
	// Contagem total
	countRow := db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM alunos
		WHERE  id_unidade = $1
		  AND  ($2 = '' OR nome    ILIKE '%' || $2 || '%')
		  AND  ($3 = '' OR codigo  ILIKE '%' || $3 || '%')
		  AND  ($4 = '' OR situacao = $4)`,
		idUnidadePadrao, f.Nome, f.Codigo, f.Situacao)
	var total int
	if err := countRow.Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := db.QueryContext(ctx, `
		SELECT id, nome, codigo, cpf, data_nascimento, situacao, COALESCE(foto_url, '')
		FROM   alunos
		WHERE  id_unidade = $1
		  AND  ($2 = '' OR nome    ILIKE '%' || $2 || '%')
		  AND  ($3 = '' OR codigo  ILIKE '%' || $3 || '%')
		  AND  ($4 = '' OR situacao = $4)
		ORDER BY nome
		LIMIT  $5  OFFSET $6`,
		idUnidadePadrao, f.Nome, f.Codigo, f.Situacao, f.Limit, f.Offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	lista := []AlunoResponse{}
	for rows.Next() {
		var a AlunoResponse
		var dn sql.NullTime
		if err := rows.Scan(&a.ID, &a.Nome, &a.Codigo, &a.CPF, &dn, &a.Situacao, &a.FotoUrl); err != nil {
			return nil, 0, err
		}
		if dn.Valid {
			a.DataNascimento = dn.Time.Format("2006-01-02")
		}
		lista = append(lista, a)
	}
	return lista, total, rows.Err()
}

// ContarAtivos retorna o total de alunos com situacao = 'Ativo'.
func ContarAtivos(ctx context.Context, db *sql.DB) (int, error) {
	var total int
	err := db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM alunos
		WHERE  id_unidade = $1 AND situacao = 'Ativo'`, idUnidadePadrao).Scan(&total)
	return total, err
}

// Criar insere um novo aluno e retorna o registro criado.
func Criar(ctx context.Context, db *sql.DB, req AlunoRequest) (*AlunoResponse, error) {
	var a AlunoResponse
	var dn sql.NullTime

	// Converte data de nascimento
	var dnInput interface{} = nil
	if req.DataNascimento != "" {
		t, err := time.Parse("2006-01-02", req.DataNascimento)
		if err == nil {
			dnInput = t
		}
	}

	err := db.QueryRowContext(ctx, `
		INSERT INTO alunos (id_unidade, nome, codigo, cpf, data_nascimento, situacao)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, nome, codigo, cpf, data_nascimento, situacao, COALESCE(foto_url, '')`,
		idUnidadePadrao, req.Nome, req.Codigo, req.CPF, dnInput, situacaoValida(req.Situacao),
	).Scan(&a.ID, &a.Nome, &a.Codigo, &a.CPF, &dn, &a.Situacao, &a.FotoUrl)
	if err != nil {
		return nil, err
	}
	if dn.Valid {
		a.DataNascimento = dn.Time.Format("2006-01-02")
	}
	return &a, nil
}

// ObterPorID busca um aluno pelo id.
func ObterPorID(ctx context.Context, db *sql.DB, id int) (*AlunoResponse, error) {
	var a AlunoResponse
	var dn sql.NullTime
	err := db.QueryRowContext(ctx, `
		SELECT id, nome, codigo, cpf, data_nascimento, situacao, COALESCE(foto_url, '')
		FROM   alunos WHERE id = $1 AND id_unidade = $2`,
		id, idUnidadePadrao).Scan(&a.ID, &a.Nome, &a.Codigo, &a.CPF, &dn, &a.Situacao, &a.FotoUrl)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if dn.Valid {
		a.DataNascimento = dn.Time.Format("2006-01-02")
	}
	return &a, nil
}

func situacaoValida(s string) string {
	switch s {
	case "Ativo", "Inativo", "Trancado", "Formado":
		return s
	default:
		return "Ativo"
	}
}

// AtualizarFoto persiste a nova URL de foto do aluno.
func AtualizarFoto(ctx context.Context, db *sql.DB, id int, fotoUrl string) error {
	_, err := db.ExecContext(ctx,
		`UPDATE alunos SET foto_url = $1 WHERE id = $2 AND id_unidade = $3`,
		fotoUrl, id, idUnidadePadrao)
	return err
}
