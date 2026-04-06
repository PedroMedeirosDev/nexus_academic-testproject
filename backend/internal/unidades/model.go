package unidades

import (
	"context"
	"database/sql"
)

type Unidade struct {
	ID    int    `json:"id"`
	Nome  string `json:"nome"`
	Sigla string `json:"sigla"`
}

func Listar(ctx context.Context, db *sql.DB) ([]Unidade, error) {
	rows, err := db.QueryContext(ctx, `SELECT id, nome, sigla FROM unidades ORDER BY nome`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lista := []Unidade{}
	for rows.Next() {
		var u Unidade
		if err := rows.Scan(&u.ID, &u.Nome, &u.Sigla); err != nil {
			return nil, err
		}
		lista = append(lista, u)
	}
	return lista, rows.Err()
}
