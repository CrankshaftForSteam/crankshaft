package executil

import "os/exec"

var flatpak = false

// Command wraps exec.Command to use flatpak-spawn when Crankshaft is running
// inside the Flatpak sandbox.
func Command(name string, args ...string) *exec.Cmd {
	if flatpak {
		cmdArgs := []string{"--host", name}
		cmdArgs = append(cmdArgs, args...)
		return exec.Command("flatpak-spawn", cmdArgs...)
	}
	return exec.Command(name, args...)
}
