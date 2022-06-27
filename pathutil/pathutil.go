// Package pathutil implements utilities for handing file paths.
package pathutil

import (
	"bufio"
	"io"
	"log"
	"os"
	"os/user"
	"path/filepath"
	"strings"

	"git.sr.ht/~avery/crankshaft/executil"
	"github.com/adrg/xdg"
)

var flatpak = false

var getCurrentUser = user.Current

// SubstituteHomeDir takes a path that might be prefixed with `~`, and returns
// the path with the `~` replaced by the user's home directory.
func SubstituteHomeDir(path string) string {
	homeDir := ""
	if flatpak {
		cmd := executil.Command("bash", "-c", "echo $HOME")
		homeDirBytes, err := cmd.Output()
		if err != nil {
			log.Fatalf("Error substituting home dir: %v", err)
		}
		homeDir = strings.TrimSpace(string(homeDirBytes))
	} else {
		usr, _ := getCurrentUser()
		homeDir = usr.HomeDir
	}

	if strings.HasPrefix(path, "~") {
		return filepath.Join(homeDir, path[2:])
	}
	return path
}

// SubstituteHomeDir takes a path that might be prefixed with `~`, or may
// contain XDG variables, and substitutes them with the appropriate path.
func SubstituteHomeAndXdg(path string) string {
	path = SubstituteHomeDir(path)
	path = strings.ReplaceAll(path, "$XDG_CACHE", xdg.CacheHome)
	path = strings.ReplaceAll(path, "$XDG_CONFIG", xdg.ConfigHome)
	path = strings.ReplaceAll(path, "$XDG_DATA", xdg.DataHome)
	path = strings.ReplaceAll(path, "$XDG_STATE", xdg.StateHome)
	return path
}

/*
AddExtPrefix adds a prefix to the path's file extension and returns a new path.

For example: AddExtPrefix("foo/bar/baz.js", ".bak") = "foo/bar/baz.bak.js"
*/
func AddExtPrefix(path string, extPrefix string) string {
	dir := filepath.Dir(path)
	filename := filepath.Base(path)
	ext := filepath.Ext(filename)

	filenameWithExtPrefix := strings.TrimSuffix(filename, ext) + extPrefix + ext

	return filepath.Join(dir, filenameWithExtPrefix)
}

// Copy copies the file from a source path to a destination path, overwriting
// the destination if it already exists.
func Copy(from, to string) error {
	fIn, err := os.Open(from)
	if err != nil {
		return err
	}
	defer fIn.Close()

	fOut, err := os.Create(to)
	if err != nil {
		return err
	}
	defer fOut.Close()

	if _, err := io.Copy(fOut, fIn); err != nil {
		return err
	}

	return nil
}

// FileLines reads in a file and returns it as an array of lines.
func FileLines(path string) ([]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	scanner.Split(bufio.ScanLines)

	fileLines := []string{}
	for scanner.Scan() {
		fileLines = append(fileLines, scanner.Text())
	}

	return fileLines, nil
}
