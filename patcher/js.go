package patcher

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path"
	"strings"

	"git.sr.ht/~avery/crankshaft/cdp"
	"git.sr.ht/~avery/crankshaft/pathutil"
)

var jsBeautifyBin = "js-beautify"

const libraryRootSP = "libraryroot~sp.js"
const sp = "sp.js"

/*
PatchJS patches Steam client scripts and reloads the client.

The Steam client overwrites any modified resources at startup, so this must be
run every time Crankshaft starts (if not already patched).

At the moment this only patches libraryroot~sp.js.
*/
func PatchJS(steamuiPath string, debugPort string, serverPort string) error {
	if err := patchLibraryRootSP(path.Join(steamuiPath, libraryRootSP), serverPort); err != nil {
		return err
	}

	if err := patchSP(path.Join(steamuiPath, "sp.js")); err != nil {
		return err
	}

	if err := reloadClient(debugPort); err != nil {
		return err
	}

	return nil
}

func checkForOriginal(scriptPath string) error {
	f, err := os.Open(scriptPath)
	if err != nil {
		return err
	}
	defer f.Close()

	s := bufio.NewScanner(f)
	// Check first line
	s.Scan()
	firstLine := s.Text()
	if strings.Contains(firstLine, "patched by crankshaft") {
		// Replace with original if possible
		err = pathutil.Copy(pathutil.AddExtPrefix(scriptPath, ".orig"), scriptPath)
		if err != nil {
			return err
		}
	}

	return nil
}

func copyOriginal(scriptPath string) error {
	copyPath := pathutil.AddExtPrefix(scriptPath, ".orig")
	fmt.Printf("Copying original %s to %s...\n", scriptPath, copyPath)
	return pathutil.Copy(scriptPath, copyPath)
}

// unmin unminifies the speecifid Javascript file with js-beautify and returns
// the unminified file path.
func unmin(filePath string, flags ...string) (string, error) {
	fmt.Println("Unminifying...")

	// foo.js will be unminified to foo.unmin.js
	unminFilePath := pathutil.AddExtPrefix(filePath, ".unmin")

	cmd := exec.Command(jsBeautifyBin, append([]string{filePath, "-o", unminFilePath}, flags...)...)
	fmt.Println(cmd.String())
	if err := cmd.Run(); err != nil {
		return "", err
	}

	return unminFilePath, nil
}

// reloadClient reloads relevant parts of the Steam client to load our
// patched scripts.
func reloadClient(debugPort string) error {
	steamClient, err := cdp.NewSteamClient(debugPort)
	if err != nil {
		return err
	}
	defer steamClient.Cancel()

	err = steamClient.RunScriptInLibrary("window.location.reload()")
	if err != nil {
		return err
	}

	return nil
}

func insertAtPos(arr *[]string, idx int, val string) {
	*arr = append((*arr)[:idx+1], (*arr)[idx:]...)
	(*arr)[idx] = val
}
