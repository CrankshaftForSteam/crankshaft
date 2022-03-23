package pathutil

import (
	"os/user"
	"testing"
)

// TestSubstituteHomeDir calls pathutil.SubstituteHomeDir with a mocked user
// and checks if the returned path is correct.
func TestSubstituteHomeDir(t *testing.T) {
	prev := getCurrentUser
	defer func() { getCurrentUser = prev }()

	getCurrentUser = func() (*user.User, error) {
		return &user.User{
			HomeDir: "/home/test",
		}, nil
	}

	path := "~/foo/bar"
	expected := "/home/test/foo/bar"

	res := SubstituteHomeDir(path)
	if res != expected {
		t.Fatalf(`SubstituteHomeDir(%v) expected %v, got %v`, path, expected, res)
	}
}
