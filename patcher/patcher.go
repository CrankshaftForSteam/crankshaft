// Package patcher handles patching of Steam client resources.
package patcher

import (
	"path"
)

// Patch patches necessary Steam resources.
func Patch(debugPort string, serverPort string, steamPath string) {
	PatchJS(path.Join(steamPath, "steamui"), debugPort, serverPort)
}
