package main

import (
	"fmt"
	"log"
	"os"

	"git.sr.ht/~avery/crankshaft/autostart"
	"git.sr.ht/~avery/crankshaft/config"
)

// FirstLaunchEnableSystemdUnits enables the autostart service on first launch.
func firstLaunchEnableSystemdUnits(dataDir string, crksftConfig *config.CrksftConfig) error {
	if autostart.HostHasSystemd() {
		unitArray := []string{"crankshaft.service", "crankshaft-update.service", "crankshaft-update.timer"}
		log.Println("Installing autostart services...")

		for _, unit := range unitArray {
			if err := autostart.InstallService(dataDir, unit); err != nil {
				return fmt.Errorf("Error installing autostart service: %v", err)
			}
			
			switch unit {
			case "crankshaft.service":
				crksftConfig.InstalledAutostart = true
			case "crankshaft-update.service":
				crksftConfig.InstalledAutoUpdate = true
			default:
				continue
			}
			
			if err := crksftConfig.Write(); err != nil {
				return fmt.Errorf("Error writing config: %v", err)
			}

			if err := autostart.StartService(unit); err != nil {
				return fmt.Errorf("Error starting Crankshaft service: %v", err)
			}
		}
		log.Println("Starting Crankshaft with Systemd and killing this instance, goodbye!")
		os.Exit(0)
	} else {
		log.Println("Not running systemd, skipping autostart service installation")
	}

	return nil
}
