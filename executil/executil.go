package executil

import (
	"log"
	"os/exec"
)

var flatpak = false

// Command wraps exec.Command to use flatpak-spawn when Crankshaft is running
// inside the Flatpak sandbox.
func Command(name string, args ...string) *exec.Cmd {
	log.Println("Command: ", name, args)
	return exec.Command(name, args...)
}
