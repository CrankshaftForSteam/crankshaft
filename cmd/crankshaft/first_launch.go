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
		var unit = "crankshaft.service"
		log.Println("Installing autostart service...")

		if err := autostart.InstallService(dataDir, unit); err != nil {
			return fmt.Errorf("Error installing autostart service: %v", err)
		}

		crksftConfig.InstalledAutostart = true

		if err := crksftConfig.Write(); err != nil {
			return fmt.Errorf("Error writing config: %v", err)
		}

		log.Println("Starting Crankshaft with Systemd and killing this instance, goodbye!")

		if err := autostart.StartService(unit); err != nil {
			return fmt.Errorf("Error starting Crankshaft service: %v", err)
		}
		os.Exit(0)
	} else {
		log.Println("Not running systemd, skipping autostart service installation")
	}

	return nil
}

// FirstLaunchEnableAutoUpdate enables the auto update service on first launch.
func firstLaunchEnableAutoUpdate(dataDir string, crksftConfig *config.CrksftConfig) error {
	if autostart.HostHasSystemd() {
		var unit = "crankshaft-update.service"
		var timer = "crankshaft-update.timer"
		log.Println("Installing auto update service...")

		if err := autostart.InstallService(dataDir, unit); err != nil {
			return fmt.Errorf("Error installing autostart service: %v", err)
		}

		if err := autostart.InstallService(dataDir, timer); err != nil {
			return fmt.Errorf("Error installing autostart timer: %v", err)
		}

		crksftConfig.InstalledAutoUpdate = true

		if err := crksftConfig.Write(); err != nil {
			return fmt.Errorf("Error writing config: %v", err)
		}

		if err := autostart.StartService(unit); err != nil {
			return fmt.Errorf("Error starting Crankshaft Update service: %v", err)
		}

		if err := autostart.StartService(timer); err != nil {
			return fmt.Errorf("Error starting Crankshaft Update timer: %v", err)
		}
	} else {
		log.Println("Not running systemd, skipping autoupdate service installation")
	}

	return nil
}
