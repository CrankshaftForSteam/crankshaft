package tray

import (
	_ "embed"
	"log"
	"os"
	"runtime"

	"git.sr.ht/~avery/crankshaft/executil"
	"git.sr.ht/~avery/systray"
)

//go:embed logo.ico
var icon []byte

// StartTray starts the system tray menu if the system has a display available.
func StartTray(onReload func() error, logsDir string) {
	// Only enable the systray if there's a DISPLAY env variable on Linux
	if runtime.GOOS != "linux" || len(os.Getenv("DISPLAY")) != 0 {
		log.Println("Starting system tray icon...")
		reloadChannel := make(chan struct{})
		go setupTray(reloadChannel, logsDir)
		go func() {
			for {
				<-reloadChannel
				if err := onReload(); err != nil {
					log.Printf("Error reloading from system tray: %v", err)
				}
			}
		}()
	}
}

func setupTray(reloadChannel chan struct{}, logsDir string) {
	systray.Run(func() {
		systray.SetTitle("Crankshaft")
		systray.SetTemplateIcon(icon, icon)

		reload := systray.AddMenuItem("Force reload", "Force Crankshaft to re-inject into the running Steam instance")
		viewLogs := systray.AddMenuItem("Open logs folder", "Open logs folder")
		quit := systray.AddMenuItem("Quit", "Quit Crankshaft")

		go func() {
			for {
				select {
				case <-reload.ClickedCh:
					log.Println("Force reload from systray")
					reloadChannel <- struct{}{}
				case <-viewLogs.ClickedCh:
					executil.Command("xdg-open", logsDir).Run()
				case <-quit.ClickedCh:
					systray.Quit()
					os.Exit(0)
				}
			}
		}()
	}, func() {})
}
