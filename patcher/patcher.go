// Package patcher handles patching of Steam client resources.
package patcher

import "git.sr.ht/~avery/steam-mod-manager/pathutil"

const linuxSteamUiPath = "~/.steam/steam/steamui/"

// Patch patches necessary Steam resources.
func Patch(debugPort string) {
	PatchJS(pathutil.SubstituteHomeDir(linuxSteamUiPath), debugPort)
}
