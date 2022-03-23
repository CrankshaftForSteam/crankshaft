package patcher

import (
	"fmt"
	"os/exec"
	"path"
	"strings"

	"git.sr.ht/~avery/steam-mod-manager/pathutil"
)

const linuxSteamUiPath = "~/.local/share/Steam/steamui/"

func getSteamUiPath() string {
	return pathutil.SubstituteHomeDir(linuxSteamUiPath)
}

var filesAlreadyUnminified = make(map[string]string)

func PatchSteamUiFile(fileName string, patchPath string) {
	steamUiPath := getSteamUiPath()
	filePath := path.Join(steamUiPath, fileName)

	// Unminify file if needed
	unminFilePath, ok := filesAlreadyUnminified[fileName]
	if !ok {
		fileExt := path.Ext(filePath)
		origFilePath := strings.TrimSuffix(filePath, fileExt) + ".orig" + fileExt
		// TODO: stop being lazy and do an io.Copy instead of commands
		cmd := exec.Command("cp", filePath, origFilePath)
		_ = cmd.Run()

		unminFilePath = unmin(filePath)
		filesAlreadyUnminified[fileName] = unminFilePath
	}

	patch(unminFilePath, patchPath)

	// TODO: stop being lazy and do an io.Copy instead of commands
	cmd := exec.Command("cp", unminFilePath, filePath)
	fmt.Println(unminFilePath, "|", filePath)
	_ = cmd.Run()
}

// unmin unminifies a file using js-beautify.
func unmin(filePath string) string {
	fmt.Println("Unminifying", filePath)
	fileExt := path.Ext(filePath)
	unminFilePath := strings.TrimSuffix(filePath, fileExt) + ".unmin" + fileExt

	cmd := exec.Command("js-beautify", filePath, "-o", unminFilePath)
	fmt.Println("unmin command", cmd)
	_ = cmd.Run()
	fmt.Println("Unminified!")

	return unminFilePath
}

func patch(filePath string, patchPath string) {
	fmt.Println("Patching", filePath, "with", patchPath)
	cmd := exec.Command("patch", "--binary", filePath, patchPath)
	_ = cmd.Run()
	fmt.Println("Patched!")
}
