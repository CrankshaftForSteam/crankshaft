package executil

import (
	"os/exec"

	"git.sr.ht/~avery/crankshaft/tags"
)

func getDisplay() string {
	// TODO: this might be* a lie
	return ":0"

	// *definitely is
}

// Command wraps exec.Command to use flatpak-spawn when Crankshaft is running
// inside the Flatpak sandbox.
func Command(name string, args ...string) *exec.Cmd {
	if !tags.Dev {
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
