// Package patcher handles patching of Steam client resources.
package patcher

import (
	"path"
)

// Patch patches necessary Steam resources.
func Patch(debugPort string, serverPort string, steamPath string) {
	patchJS(path.Join(steamPath, "steamui"), debugPort, serverPort)
}

// Cleanup cleans up patched Steam resources.
func Cleanup(steamPath string) error {
	return cleanupJS(path.Join(steamPath, "steamui"))
}
