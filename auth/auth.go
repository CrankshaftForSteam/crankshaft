package auth

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
)

func GenAuthToken() (string, error) {
	authTokenBytes := make([]byte, 16)
	if _, err := rand.Read(authTokenBytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(authTokenBytes), nil
}

func RequireAuth(authToken string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet || r.Method == http.MethodOptions || r.Method == http.MethodHead {
			h.ServeHTTP(w, r)
			return
		}

		token, found := r.Header["X-Cs-Auth"]
		if !found || len(token) < 1 {
			http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
			return
		}

		if token[0] != authToken {
			http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
			return
		}

		h.ServeHTTP(w, r)
	})
}
