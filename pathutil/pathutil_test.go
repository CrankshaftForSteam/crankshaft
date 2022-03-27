package pathutil

import (
	"os"
	"os/user"
	"path"
	"reflect"
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
		t.Fatalf(`SubstituteHomeDir(%v) expected "%v", got "%v"`, path, expected, res)
	}
}

func TestAddExtPrefix(t *testing.T) {
	path := "foo/bar/baz.js"
	extPrefix := ".bak"
	expected := "foo/bar/baz.bak.js"

	res := AddExtPrefix(path, extPrefix)
	if res != expected {
		t.Fatalf(`AddExtPrefix(%v, %v) expected "%v", got "%v"`, path, extPrefix, expected, res)
	}
}

func TestCopy(t *testing.T) {
	contents := "example"
	source := path.Join(t.TempDir(), "foo")
	dest := path.Join(t.TempDir(), "bar")

	// Create source file
	f, _ := os.Create(source)
	f.WriteString(contents)
	f.Close()

	err := Copy(source, dest)
	if err != nil {
		t.Fatalf("Copy(%v, %v) returned error: %v", source, dest, err)
	}

	data, err := os.ReadFile(dest)
	if err != nil {
		t.Fatalf("Error reading dest file: %v", err)
	}

	if string(data) != contents {
		t.Fatalf(`Copied file contents did not match source file contents, expected "%v", got "%v"`, contents, string(data))
	}
}

func TestFileLinesTestFileLines(t *testing.T) {
	path := path.Join(t.TempDir(), "example")
	contents := "foo\nbar\nbaz"
	expected := []string{"foo", "bar", "baz"}

	// Create example file
	f, _ := os.Create(path)
	f.WriteString(contents)
	f.Close()

	fileLines, err := FileLines(path)
	if err != nil {
		t.Fatalf("FileLines(%v) returned error: %v", path, err)
	}

	if !reflect.DeepEqual(fileLines, expected) {
		t.Fatalf(`FileLines(%v) expected "%v", got "%v"`, path, expected, fileLines)
	}
}
