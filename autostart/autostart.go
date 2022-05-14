package autostart

import (
	_ "embed"
	"io/ioutil"
	"path"

	"git.sr.ht/~avery/crankshaft/executil"
)

//go:embed crankshaft.service
var unit string

// HostHasSystemd checks if the host system is using Systemd, which is required
// for the autostart service.
func HostHasSystemd() bool {
	cmd := executil.Command("bash", "-c", "[ -d /run/systemd/system ]")
	return cmd.Run() == nil
}

// TODO: It would probably be better to use the D-Bus API, but it's a
// restricted Flathub permission, I have to look into it more.

// ServiceInstalled checks if the autostart service is enabled.
func ServiceInstalled() bool {
	if !HostHasSystemd() {
		return false
	}

	cmd := executil.Command("bash", "-c", "systemctl --user list-units --full --all | grep crankshaft.service")
	return cmd.Run() == nil
}

// InstallService saves the autostart unit file and enables it with Systemd.
func InstallService(dataDir string) error {
	unitPath := path.Join(dataDir, "crankshaft.service")

	err := ioutil.WriteFile(unitPath, []byte(unit), 0755)
	if err != nil {
		return err
	}

	cmd := executil.Command("systemctl", "--user", "enable", unitPath)
	return cmd.Run()
}

// DisableService disables the autostart service.
func DisableService() error {
	cmd := executil.Command("systemctl", "--user", "disable", "crankshaft.service")
	return cmd.Run()
}
