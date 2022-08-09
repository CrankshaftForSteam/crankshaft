package config

import (
	"os"

	"git.sr.ht/~avery/crankshaft/pathutil"
)

func getDefaultSteamPath() (steamPath string) {
	steamPath = pathutil.SubstituteHomeDir("~/.steam/steam")
	if _, err := os.Stat(steamPath); err == nil {
		return
	}

	steamPath = pathutil.SubstituteHomeDir("~/.var/app/com.valvesoftware.Steam/.steam/steam")
	if _, err := os.Stat(steamPath); err == nil {
		return
	}

	// This will error later, return the most common path for user to debug
	return pathutil.SubstituteHomeDir("~/.steam/steam")
}
