package tray

import (
	_ "embed"
	"log"
	"os"

	"git.sr.ht/~avery/systray"
)

//go:embed logo.ico
var icon []byte

func StartTray(reloadChannel chan struct{}) {
	systray.SetTitle("Crankshaft")
	systray.SetTemplateIcon(icon, icon)

	reload := systray.AddMenuItem("Force Reload", "Force Crankshaft to re-inject into the running Steam instance")
	quit := systray.AddMenuItem("Quit", "Quit Crankshaft")

	go func() {
		for {
			select {
			case <-reload.ClickedCh:
				log.Println("Force reload from systray")
				reloadChannel <- struct{}{}
			case <-quit.ClickedCh:
				systray.Quit()
				os.Exit(0)
			}
		}
	}()

	systray.Run(func() {}, func() {})
}
