package chamados

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

// idUnidadePadrao é o id da unidade "Nexus" (registrada no seed).
// TODO: substituir pelo id extraído do JWT quando autenticação estiver pronta.
const idUnidadePadrao = 1

// Listar retorna chamados com filtragem dinâmica e paginação.
func Listar(ctx context.Context, db *sql.DB, f Filtros) ([]ChamadoResponse, int, error) {
	args := []any{idUnidadePadrao}
	cond := "c.id_unidade = $1"

	if f.Num != "" {
		args = append(args, f.Num+"%")
		cond += fmt.Sprintf(" AND c.id::text LIKE $%d", len(args))
	}
	if f.Assunto != "" {
		args = append(args, "%"+f.Assunto+"%")
		cond += fmt.Sprintf(" AND c.assunto ILIKE $%d", len(args))
	}
	if f.Solicitante != "" {
		args = append(args, "%"+f.Solicitante+"%")
		cond += fmt.Sprintf(" AND c.solicitante ILIKE $%d", len(args))
	}
	if f.Responsavel != "" {
		args = append(args, "%"+f.Responsavel+"%")
		cond += fmt.Sprintf(" AND c.responsavel ILIKE $%d", len(args))
	}

	// Contagem total (sem paginação)
	var total int
	if err := db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM sup_chamados c WHERE "+cond,
		args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Dados paginados
	limitIdx := len(args) + 1
	offsetIdx := len(args) + 2

	rows, err := db.QueryContext(ctx, fmt.Sprintf(`
		SELECT c.id, c.assunto, c.descricao, c.situacao, c.prioridade,
		       c.tipo, c.setor, c.solicitante, c.responsavel,
		       c.criado_em, u.sigla
		FROM   sup_chamados c
		JOIN   unidades u ON u.id = c.id_unidade
		WHERE  %s
		ORDER  BY c.criado_em DESC
		LIMIT  $%d OFFSET $%d`, cond, limitIdx, offsetIdx),
		append(args, f.Limit, f.Offset)...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	lista := []ChamadoResponse{}
	for rows.Next() {
		var c ChamadoResponse
		var criadoEm time.Time
		if err := rows.Scan(
			&c.ID, &c.Assunto, &c.Descricao, &c.Situacao, &c.Prioridade,
			&c.Tipo, &c.Setor, &c.Solicitante, &c.Responsavel,
			&criadoEm, &c.Unidade,
		); err != nil {
			return nil, 0, err
		}
		c.DataHora = criadoEm.Format("02/01/2006 15:04")
		lista = append(lista, c)
	}
	return lista, total, rows.Err()
}

// Criar insere um novo chamado e retorna o registro criado.
func Criar(ctx context.Context, db *sql.DB, req ChamadoRequest) (*ChamadoResponse, error) {
	var c ChamadoResponse
	var criadoEm time.Time

	err := db.QueryRowContext(ctx, `
		INSERT INTO sup_chamados
		  (id_unidade, assunto, descricao, situacao, prioridade, tipo, setor, solicitante, responsavel)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, assunto, descricao, situacao, prioridade, tipo, setor, solicitante, responsavel, criado_em`,
		idUnidadePadrao,
		req.Assunto, req.Descricao, req.Situacao, req.Prioridade,
		req.Tipo, req.Setor, req.Solicitante, req.Responsavel,
	).Scan(&c.ID, &c.Assunto, &c.Descricao, &c.Situacao, &c.Prioridade,
		&c.Tipo, &c.Setor, &c.Solicitante, &c.Responsavel, &criadoEm)
	if err != nil {
		return nil, err
	}
	c.DataHora = criadoEm.Format("02/01/2006 15:04")
	c.Unidade = "CD"
	return &c, nil
}

// Atualizar edita um chamado existente. Retorna nil se não encontrado.
func Atualizar(ctx context.Context, db *sql.DB, id int, req ChamadoRequest) (*ChamadoResponse, error) {
	var c ChamadoResponse
	var criadoEm time.Time

	err := db.QueryRowContext(ctx, `
		UPDATE sup_chamados
		SET    assunto     = $1,
		       descricao   = $2,
		       situacao    = $3,
		       prioridade  = $4,
		       tipo        = $5,
		       setor       = $6,
		       solicitante = $7,
		       responsavel = $8,
		       atualizado_em = NOW()
		WHERE  id = $9 AND id_unidade = $10
		RETURNING id, assunto, descricao, situacao, prioridade, tipo, setor, solicitante, responsavel, criado_em`,
		req.Assunto, req.Descricao, req.Situacao, req.Prioridade,
		req.Tipo, req.Setor, req.Solicitante, req.Responsavel,
		id, idUnidadePadrao,
	).Scan(&c.ID, &c.Assunto, &c.Descricao, &c.Situacao, &c.Prioridade,
		&c.Tipo, &c.Setor, &c.Solicitante, &c.Responsavel, &criadoEm)

	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	c.DataHora = criadoEm.Format("02/01/2006 15:04")
	c.Unidade = "CD"
	return &c, nil
}

// Excluir remove um chamado. Retorna false se não encontrado.
func Excluir(ctx context.Context, db *sql.DB, id int) (bool, error) {
	res, err := db.ExecContext(ctx,
		`DELETE FROM sup_chamados WHERE id = $1 AND id_unidade = $2`,
		id, idUnidadePadrao)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// ListarHistorico retorna todas as mensagens do histórico de um chamado.
func ListarHistorico(ctx context.Context, db *sql.DB, idChamado int) ([]HistoricoResponse, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT id, autor, mensagem, criado_em
		FROM   sup_historico_chamado
		WHERE  id_chamado = $1
		ORDER  BY criado_em`, idChamado)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lista := []HistoricoResponse{}
	for rows.Next() {
		var h HistoricoResponse
		var criadoEm time.Time
		if err := rows.Scan(&h.ID, &h.Autor, &h.Mensagem, &criadoEm); err != nil {
			return nil, err
		}
		h.Data = criadoEm.Format("02/01/2006 15:04")
		lista = append(lista, h)
	}
	return lista, rows.Err()
}

// AdicionarHistorico insere uma mensagem no histórico de um chamado.
func AdicionarHistorico(ctx context.Context, db *sql.DB, idChamado int, req HistoricoRequest) (*HistoricoResponse, error) {
	var h HistoricoResponse
	var criadoEm time.Time

	err := db.QueryRowContext(ctx, `
		INSERT INTO sup_historico_chamado (id_chamado, autor, mensagem)
		VALUES ($1, $2, $3)
		RETURNING id, autor, mensagem, criado_em`,
		idChamado, req.Autor, req.Mensagem,
	).Scan(&h.ID, &h.Autor, &h.Mensagem, &criadoEm)
	if err != nil {
		return nil, err
	}
	h.Data = criadoEm.Format("02/01/2006 15:04")
	return &h, nil
}
