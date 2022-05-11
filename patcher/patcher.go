// Package patcher handles patching of Steam client resources.
package patcher

import (
	"path"

	"git.sr.ht/~avery/crankshaft/pathutil"
	"github.com/adrg/xdg"
)

func getSteamUiPath() string {
	return pathutil.SubstituteHomeDir(path.Join(xdg.DataHome, "Steam", "steamui"))
}

// Patch patches necessary Steam resources.
func Patch(debugPort string, serverPort string) {
	PatchJS(getSteamUiPath(), debugPort, serverPort)
}
