package tray

import (
	_ "embed"
	"os"

	"git.sr.ht/~avery/systray"
)

//go:embed puzzle.ico
var icon []byte

func StartTray() {
	systray.SetTitle("Crankshaft")
	systray.SetTemplateIcon(icon, icon)

	quit := systray.AddMenuItem("Quit", "Quit Crankshaft")

	go func() {
		<-quit.ClickedCh
		systray.Quit()
		os.Exit(0)
	}()

	systray.Run(func() {}, func() {})
}
