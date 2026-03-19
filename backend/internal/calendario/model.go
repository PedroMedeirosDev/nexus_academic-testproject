package calendario

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

// idUnidadePadrao é o id da unidade "Nexus" (registrada no seed).
// TODO: substituir pelo id extraído do JWT quando autenticação estiver pronta.
const idUnidadePadrao = 1

// Listar retorna todos os eventos de um mês/ano para a unidade padrão.
func Listar(ctx context.Context, db *sql.DB, mes, ano int) ([]EventoResponse, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT id, titulo, descricao, data, hora_inicio, hora_fim, dia_inteiro
		FROM   cal_eventos
		WHERE  id_unidade = $1
		  AND  EXTRACT(MONTH FROM data) = $2
		  AND  EXTRACT(YEAR  FROM data) = $3
		ORDER BY data, hora_inicio`,
		idUnidadePadrao, mes, ano)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lista := []EventoResponse{}
	for rows.Next() {
		var e EventoResponse
		var data time.Time
		if err := rows.Scan(&e.ID, &e.Titulo, &e.Descricao, &data,
			&e.HoraInicio, &e.HoraFim, &e.DiaInteiro); err != nil {
			return nil, err
		}
		e.Data = data.Format("2006-01-02")
		lista = append(lista, e)
	}
	return lista, rows.Err()
}

// Criar insere um novo evento e retorna o registro criado.
func Criar(ctx context.Context, db *sql.DB, req EventoRequest) (*EventoResponse, error) {
	var e EventoResponse
	var data time.Time

	err := db.QueryRowContext(ctx, `
		INSERT INTO cal_eventos
		  (id_unidade, titulo, descricao, data, hora_inicio, hora_fim, dia_inteiro)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, titulo, descricao, data, hora_inicio, hora_fim, dia_inteiro`,
		idUnidadePadrao,
		req.Titulo, req.Descricao, req.Data,
		req.HoraInicio, req.HoraFim, req.DiaInteiro,
	).Scan(&e.ID, &e.Titulo, &e.Descricao, &data,
		&e.HoraInicio, &e.HoraFim, &e.DiaInteiro)
	if err != nil {
		return nil, err
	}
	e.Data = data.Format("2006-01-02")
	return &e, nil
}

// Atualizar edita um evento existente. Retorna nil se não encontrado.
func Atualizar(ctx context.Context, db *sql.DB, id int, req EventoRequest) (*EventoResponse, error) {
	var e EventoResponse
	var data time.Time

	err := db.QueryRowContext(ctx, `
		UPDATE cal_eventos
		SET    titulo      = $1,
		       descricao   = $2,
		       data        = $3,
		       hora_inicio = $4,
		       hora_fim    = $5,
		       dia_inteiro = $6,
		       atualizado_em = NOW()
		WHERE  id = $7 AND id_unidade = $8
		RETURNING id, titulo, descricao, data, hora_inicio, hora_fim, dia_inteiro`,
		req.Titulo, req.Descricao, req.Data,
		req.HoraInicio, req.HoraFim, req.DiaInteiro,
		id, idUnidadePadrao,
	).Scan(&e.ID, &e.Titulo, &e.Descricao, &data,
		&e.HoraInicio, &e.HoraFim, &e.DiaInteiro)

	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e.Data = data.Format("2006-01-02")
	return &e, nil
}

// Excluir remove um evento. Retorna false se não encontrado.
func Excluir(ctx context.Context, db *sql.DB, id int) (bool, error) {
	res, err := db.ExecContext(ctx,
		`DELETE FROM cal_eventos WHERE id = $1 AND id_unidade = $2`,
		id, idUnidadePadrao)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}
