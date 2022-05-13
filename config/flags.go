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

func ParseFlags() (debugPort string, serverPort string, skipPatching bool, dataDir string, pluginsDir string, logsDir string, steamPath string) {
	dataHome := GetXdgDataHome()
	stateHome := GetXdgStateHome()

	debugPort = *flag.String("debug-port", "8080", "CEF debug port")
	serverPort = *flag.String("server-port", "8085", "Port to run HTTP/websocket server on")
	skipPatching = *flag.Bool("skip-patching", false, "Skip patching Steam client resources")
	dataDir = *flag.String("data-dir", path.Join(dataHome, "crankshaft"), "Crankshaft data directory")
	pluginsDir = *flag.String("plugins-dir", path.Join(dataHome, "crankshaft", "plugins"), "Directory to load plugins from")
	logsDir = *flag.String("logs-dir", path.Join(stateHome, "crankshaft", "logs"), "Directory to write logs to")
	steamPath = *flag.String("steam-path", path.Join(dataHome, "Steam"), "Path to Steam files")
	flag.Parse()
	return
}
