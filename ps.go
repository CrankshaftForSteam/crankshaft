package main

import (
	"fmt"
	"os/exec"
	"time"
)

// isSteamRunning checks if the steamwebhelper process is running.
func isSteamRunning() bool {
	cmd := exec.Command("bash", "-c", "ps -ef | grep steamwebhelper | grep -v grep")
	return cmd.Run() == nil
}

// waitForSteamProcess waits for the steamwebhelper process to start.
func waitForSteamProcess() {
	fmt.Println("Waiting for steamwebhelper...")
	for {
		if isSteamRunning() {
			break
		}
		time.Sleep(1 * time.Second)
	}
	fmt.Println("steamwebhelper found!")
}

// waitForSteamProcessToStop waits for the steamwebhelper process to stop.
func waitForSteamProcessToStop() {
	for {
		if !isSteamRunning() {
			break
		}
		time.Sleep(1 * time.Second)
	}
}
