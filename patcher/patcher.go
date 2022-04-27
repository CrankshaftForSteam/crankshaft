// Package patcher handles patching of Steam client resources.
package patcher

import (
	"path"

	"git.sr.ht/~avery/crankshaft/config"
)

func getSteamUiPath() string {
	return path.Join(config.GetXdgDataHome(), "Steam", "steamui")
}

// Patch patches necessary Steam resources.
func Patch(debugPort string, serverPort string) {
	PatchJS(getSteamUiPath(), debugPort, serverPort)
}
