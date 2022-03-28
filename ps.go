package main

import (
	"fmt"
	"os/exec"
	"time"
)

func waitForSteamProcess() {
	fmt.Println("Waiting for steamwebhelper...")
	for {
		cmd := exec.Command("bash", "-c", "ps -ef | grep steamwebhelper | grep -v grep")
		if cmd.Run() == nil {
			break
		}
		time.Sleep(1 * time.Second)
	}
	fmt.Println("steamwebhelper found!")
}
