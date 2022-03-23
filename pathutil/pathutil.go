// Package pathutil implements utilities for handing file paths.
package pathutil

import (
	"os/user"
	"path/filepath"
	"strings"
)

var getCurrentUser = user.Current

// SubstituteHomeDir takes a path that might be prefixed with `~`, and returns
// the path with the `~` replaced by the user's home directory.
func SubstituteHomeDir(path string) string {
	usr, _ := getCurrentUser()
	homeDir := usr.HomeDir
	if strings.HasPrefix(path, "~") {
		return filepath.Join(homeDir, path[2:])
	}
	return path
}
