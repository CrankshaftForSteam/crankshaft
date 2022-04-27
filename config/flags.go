package config

import (
	"flag"
	"path"

	"git.sr.ht/~avery/crankshaft/pathutil"
	"github.com/adrg/xdg"
)

func GetXdgDataHome() string {
	if !flatpak {
		return xdg.DataHome
	}

	/*
		When running in Flatpak sandbox we want to use the host's XDG directories,
		not the sandbox directories.

		Potential future enhancement is to try getting the environment variable
		value from host with flatpak-spawn, but this should be good enough.
	*/
	return pathutil.SubstituteHomeDir("~/.local/share")
}

func GetXdgStateHome() string {
	if !flatpak {
		return xdg.StateHome
	}

	return pathutil.SubstituteHomeDir("~/.local/state")
}

func ParseFlags() (debugPort string, serverPort string, skipPatching bool, dataDir string, pluginsDir string, logsDir string) {
	dataHome := GetXdgDataHome()
	stateHome := GetXdgStateHome()

	debugPort = *flag.String("debug-port", "8080", "CEF debug port")
	serverPort = *flag.String("server-port", "8085", "Port to run HTTP/websocket server on")
	skipPatching = *flag.Bool("skip-patching", false, "Skip patching Steam client resources")
	dataDir = *flag.String("data-dir", path.Join(dataHome, "crankshaft"), "Crankshaft data directory")
	pluginsDir = *flag.String("plugins-dir", path.Join(dataHome, "crankshaft", "plugins"), "Directory to load plugins from")
	logsDir = *flag.String("logs-dir", path.Join(stateHome, "crankshaft", "logs"), "Directory to write logs to")
	flag.Parse()
	return
}
