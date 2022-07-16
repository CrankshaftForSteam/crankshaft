package executil

import (
	"os/exec"
)

var flatpak = false

func getDisplay() string {
	// TODO: this might be* a lie
	return ":0"

	// *definitely is
}

// Command wraps exec.Command to use flatpak-spawn when Crankshaft is running
// inside the Flatpak sandbox.
func Command(name string, args ...string) *exec.Cmd {
	if flatpak {
		cmdArgs := []string{
			// Run command on host
			"--host",
			// Passthrough display env variable for graphical apps
			"--env=DISPLAY=" + getDisplay(),
			name,
		}
		cmdArgs = append(cmdArgs, args...)
		return exec.Command("flatpak-spawn", cmdArgs...)
	}
	return exec.Command(name, args...)
}
