package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	Token  string `json:"token"`
	Status string `json:"status"`
}

// Login handles POST /api/login.
// It prints the received credentials to stdout and returns a fake JWT token.
func Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Imprime as credenciais recebidas no terminal (apenas para desenvolvimento)
	fmt.Printf("[LOGIN] email=%q | password=%q\n", req.Email, req.Password)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	resp := loginResponse{
		Token:  "fake-jwt-token-123",
		Status: "success",
	}
	json.NewEncoder(w).Encode(resp)
}
