//go:build !dev

package patcher

import (
	"os"
	"path"
	"path/filepath"
)

func init() {
	// When running a release, load js-beautify binary that's next to crankshaft
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)
	jsBeautifyBin = path.Join(exeDir, "js-beautify")
}
