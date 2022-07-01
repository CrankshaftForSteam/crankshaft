package patcher

import (
	"bufio"
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"

	"git.sr.ht/~avery/crankshaft/build"
	"git.sr.ht/~avery/crankshaft/cdp"
	"git.sr.ht/~avery/crankshaft/pathutil"
)

var jsBeautifyBin = "js-beautify"

const libraryRootSP = "libraryroot~sp.js"
const sp = "sp.js"

/*
patchJS patches Steam client scripts and reloads the client.

The Steam client overwrites any modified resources at startup, so this must be
run every time Crankshaft starts (if not already patched).

At the moment this only patches libraryroot~sp.js.
*/
func patchJS(steamuiPath string, debugPort string, serverPort string, cacheDir string) error {
	if err := patchLibraryRootSP(path.Join(steamuiPath, libraryRootSP), serverPort, cacheDir); err != nil {
		return err
	}

	if err := patchSP(path.Join(steamuiPath, "sp.js"), serverPort, cacheDir); err != nil {
		return err
	}

	if err := reloadClient(debugPort); err != nil {
		return err
	}

	return nil
}

/*
cleanupJS cleans up patched Steam files and returns them to their original
state. This is necessary after Crankshaft exists. If we don't clean up clean up
these scripts, Steam will go through a >30 second update process next time it
launches.
*/
func cleanupJS(steamuiPath string) error {
	files := []string{libraryRootSP, sp}
	for _, filename := range files {
		path := path.Join(steamuiPath, filename)

		// Check if original file exists
		origPath := pathutil.AddExtPrefix(path, ".orig")
		if _, err := os.Stat(origPath); err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}
			return err
		}

		log.Println("Writing original", filename)
		pathutil.Copy(origPath, path)
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
	log.Printf("Copying original %s to %s...\n", scriptPath, copyPath)
	return pathutil.Copy(scriptPath, copyPath)
}

func getCachedFilePath(scriptPath, cacheDir, md5sum string) string {
	cachedFileName := fmt.Sprintf("%s.%s.%s", filepath.Base(scriptPath), build.VERSION, md5sum)
	return path.Join(cacheDir, "patched", cachedFileName)
}

func useCachedPatchedScript(scriptPath, cacheDir string) (bool, string, error) {
	data, err := os.ReadFile(scriptPath)
	if err != nil {
		return false, "", err
	}

	sum := md5.Sum(data)
	sumStr := hex.EncodeToString(sum[:])

	// Check if we have a cached copy
	cachedFilePath := getCachedFilePath(scriptPath, cacheDir, sumStr)
	if _, err := os.Stat(cachedFilePath); err != nil {
		if os.IsNotExist(err) {
			return false, sumStr, nil
		}
		return false, sumStr, err
	}

	log.Println("Using cached file")

	return true, sumStr, pathutil.Copy(cachedFilePath, scriptPath)
}

func cachePatchedScript(fileLines []string, scriptPath, cacheDir, origSum string) error {
	cachedFilePath := getCachedFilePath(scriptPath, cacheDir, origSum)

	log.Printf("Writing patched file to cache at %s\n", cachedFilePath)

	err := os.WriteFile(cachedFilePath, []byte(strings.Join(fileLines, "\n")), 0755)
	if err != nil {
		return err
	}

	return nil
}

// unmin unminifies the speecifid Javascript file with js-beautify and returns
// the unminified file path.
func unmin(filePath string, flags ...string) (string, error) {
	log.Println("Unminifying...")

	// foo.js will be unminified to foo.unmin.js
	unminFilePath := pathutil.AddExtPrefix(filePath, ".unmin")

	cmd := exec.Command(jsBeautifyBin, append([]string{"-o", unminFilePath, filePath}, flags...)...)
	log.Println(cmd.String())
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
