package main

import (
	"fmt"
	"log"
	"os"

	"git.sr.ht/~avery/crankshaft/autostart"
	"git.sr.ht/~avery/crankshaft/config"
)

// FirstLaunchEnableAutostart enables the autostart service on first launch.
func firstLaunchEnableAutostart(dataDir string, crksftConfig *config.CrksftConfig) error {
	if autostart.HostHasSystemd() {
		log.Println("Installing autostart service...")

		if err := autostart.InstallService(dataDir); err != nil {
			return fmt.Errorf("Error installing autostart service: %v", err)
		}

		crksftConfig.InstalledAutostart = true

		if err := crksftConfig.Write(); err != nil {
			return fmt.Errorf("Error writing config: %v", err)
		}

		log.Println("Starting Crankshaft with Systemd and killing this instance, goodbye!")

		if err := autostart.StartService(); err != nil {
			return fmt.Errorf("Error starting Crankshaft service: %v", err)
		}
		os.Exit(0)
	} else {
		log.Println("Not running systemd, skipping autostart service installation")
	}

	return nil
}
