package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGenAuthToken(t *testing.T) {
	token, err := GenAuthToken()
	if err != nil {
		t.Fatal(err)
	}

	if len(token) != 32 {
		t.Fatalf(`len(token) expected "%v", got "%v", token: %v`, 32, len(token), token)
	}
}

func TestRequireAuthAllowed(t *testing.T) {
	token, err := GenAuthToken()
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest("POST", "/rpc", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("X-Cs-Auth", token)

	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

	recorder := httptest.NewRecorder()

	handler := RequireAuth(token, testHandler)
	handler.ServeHTTP(recorder, req)

	res := recorder.Result()

	if res.StatusCode != http.StatusOK {
		t.Fatalf(`res.StatusCode expected "%v", got "%v"`, http.StatusOK, res.StatusCode)
	}
}

func TestRequireAuthForbidden(t *testing.T) {
	token, err := GenAuthToken()
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest("POST", "/rpc", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("X-Cs-Auth", "123")

	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

	recorder := httptest.NewRecorder()

	handler := RequireAuth(token, testHandler)
	handler.ServeHTTP(recorder, req)

	res := recorder.Result()

	if res.StatusCode != http.StatusForbidden {
		t.Fatalf(`res.StatusCode expected "%v", got "%v"`, http.StatusForbidden, res.StatusCode)
	}
}
