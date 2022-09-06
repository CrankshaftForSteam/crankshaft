package autostart

import (
	_ "embed"
	"io/ioutil"
	"path"
	"strings"

	"git.sr.ht/~avery/crankshaft/executil"
)

//go:embed crankshaft.service
var startUnit string
//go:embed crankshaft-update.service
var updateUnit string
//go:embed crankshaft-update.timer
var updateTimer string

// HostHasSystemd checks if the host system is using Systemd, which is required
// for the autostart service.
func HostHasSystemd() bool {
	cmd := executil.Command("bash", "-c", "[ -d /run/systemd/system ]")
	return cmd.Run() == nil
}

// TODO: It would probably be better to use the D-Bus API, but it's a
// restricted Flathub permission, I have to look into it more.

// ServiceInstalled checks if a given systemd unit service is enabled.
func ServiceInstalled(unit string) bool {
	if !HostHasSystemd() {
		return false
	}
	cmd := executil.Command("systemctl", "--user", "status", unit)
	return cmd.Run() == nil
}

// InstallService saves the autostart unit file and enables it with Systemd.
func InstallService(dataDir string, unitName string) error {
	var unitFile string
	switch unitName {
	case "crankshaft.service":
		unitFile = startUnit
	case "crankshaft-update.service":
		unitFile = updateUnit
	case "crankshaft-update.timer":
		unitFile = updateTimer
	}

	// If the user is on a handheld, make service restart more aggressively
	isOnHandheld := false

	// Steam Deck
	{
		cmd := executil.Command("whoami")
		whoami, _ := cmd.Output()
		if strings.TrimSpace(string(whoami)) == "deck" {
			isOnHandheld = true
		}
	}

	// ChimeraOS
	{
		cmd := executil.Command("bash", "-c", "ls $HOME/.local/share/chimera")
		err := cmd.Run()
		if err == nil {
			isOnHandheld = true
		}
	}

	if isOnHandheld {
		unitFile = strings.ReplaceAll(unitFile, "Restart=on-failure", "Restart=always")
	}

	unitPath := path.Join(dataDir, unitName)

	err := ioutil.WriteFile(unitPath, []byte(unitFile), 0755)
	if err != nil {
		return err
	}

	cmd := executil.Command("systemctl", "--user", "enable", unitPath)
	return cmd.Run()
}

// DisableService disables the autostart service.
func DisableService(unitName string) error {
	cmd := executil.Command("systemctl", "--user", "disable", unitName)
	return cmd.Run()
}

// StartService starts Crankshaft through the autostart service
func StartService(unitName string) error {
	cmd := executil.Command("systemctl", "--user", "start", unitName)
	return cmd.Run()
}
