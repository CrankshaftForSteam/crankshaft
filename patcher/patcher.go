// Package patcher handles patching of Steam client resources.
package patcher

import (
	"path"

	"github.com/adrg/xdg"
)

func getSteamUiPath() string {
	return path.Join(xdg.DataHome, "Steam", "steamui")
}

// Patch patches necessary Steam resources.
func Patch(debugPort string, serverPort string) {
	PatchJS(getSteamUiPath(), debugPort, serverPort)
}
