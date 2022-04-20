package ps

import (
	"fmt"
	"os/exec"
	"time"
)

// IsSteamRunning checks if the steamwebhelper process is running.
func IsSteamRunning() bool {
	cmd := exec.Command("bash", "-c", "ps -ef | grep steamwebhelper | grep -v grep")
	return cmd.Run() == nil
}

// WaitForSteamProcess waits for the steamwebhelper process to start.
func WaitForSteamProcess() {
	fmt.Println("Waiting for steamwebhelper...")
	for {
		if IsSteamRunning() {
			break
		}
		time.Sleep(1 * time.Second)
	}
	fmt.Println("steamwebhelper found!")
}

// WaitForSteamProcessToStop waits for the steamwebhelper process to stop.
func WaitForSteamProcessToStop() {
	for {
		if !IsSteamRunning() {
			break
		}
		time.Sleep(1 * time.Second)
	}
}
