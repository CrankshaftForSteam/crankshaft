package config

import (
	"flag"
	"path"

	"github.com/adrg/xdg"
)

func GetXdgDataHome() string {
	return xdg.DataHome
}

func GetXdgStateHome() string {
	return xdg.StateHome
}

func ParseFlags() (debugPort string, serverPort string, skipPatching bool, dataDir string, pluginsDir string, logsDir string, steamPath string, cleanup bool) {
	dataHome := GetXdgDataHome()
	stateHome := GetXdgStateHome()

	fDebugPort := flag.String("debug-port", "8080", "CEF debug port")
	fServerPort := flag.String("server-port", "8085", "Port to run HTTP/websocket server on")
	fSkipPatching := flag.Bool("skip-patching", false, "Skip patching Steam client resources")
	fDataDir := flag.String("data-dir", path.Join(dataHome, "crankshaft"), "Crankshaft data directory")
	fPluginsDir := flag.String("plugins-dir", path.Join(dataHome, "crankshaft", "plugins"), "Directory to load plugins from")
	fLogsDir := flag.String("logs-dir", path.Join(stateHome, "crankshaft", "logs"), "Directory to write logs to")
	fSteamPath := flag.String("steam-path", path.Join(dataHome, "Steam"), "Path to Steam files")
	fCleanup := flag.Bool("cleanup", false, "Cleanup patched files and exit")

	flag.Parse()

	debugPort = *fDebugPort
	serverPort = *fServerPort
	skipPatching = *fSkipPatching
	dataDir = *fDataDir
	pluginsDir = *fPluginsDir
	logsDir = *fLogsDir
	steamPath = *fSteamPath
	cleanup = *fCleanup

	return
}
