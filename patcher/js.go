package patcher

import (
	"bufio"
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"strings"

	"git.sr.ht/~avery/crankshaft/build"
	"git.sr.ht/~avery/crankshaft/cdp"
	"git.sr.ht/~avery/crankshaft/pathutil"
)

var jsBeautifyBin = "js-beautify"

const sp = "sp.js"

/*
patchJS patches Steam client scripts and reloads the client.

The Steam client overwrites any modified resources at startup, so this must be
run every time Crankshaft starts (if not already patched).

At the moment this only patches libraryroot~sp.js.
*/
func patchJS(steamuiPath string, debugPort string, serverPort string, cacheDir string, noCache bool, authToken string) error {
	// Find library root
	foundLibraryRootSP := false
	var patchingError error
	files, err := ioutil.ReadDir(steamuiPath)
	if err != nil {
		return fmt.Errorf("Error reading steamui dir: %v", err)
	}

	for _, file := range files {
		fileName := file.Name()
		filePath := path.Join(steamuiPath, fileName)

		if file.IsDir() || !strings.HasSuffix(fileName, ".js") || strings.HasSuffix(fileName, ".orig.js") || strings.HasSuffix(fileName, ".unmin.js") {
			continue
		}

		contents, err := ioutil.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf(`Error reading file "%s": %v`, file.Name(), err)
		}

		if strings.Contains(string(contents), "GetWhatsNewEvents") {
			foundLibraryRootSP = true
			if err := patchLibraryRootSP(filePath, serverPort, cacheDir, noCache, authToken); err != nil {
				patchingError = err
				continue
			}
		}
	}

	if !foundLibraryRootSP {
		if patchingError != nil {
			return fmt.Errorf("Error while patching libraryroot: %v", patchingError)
		}
		return errors.New("libraryRootSP not found for patching.")
	}

	if err := patchSP(path.Join(steamuiPath, "sp.js"), serverPort, cacheDir, noCache, authToken); err != nil {
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
	// Find files wiith .orig.js
	files, err := ioutil.ReadDir(steamuiPath)
	if err != nil {
		return fmt.Errorf("Error listing original files: %v", err)
	}

	for _, file := range files {
		fileName := file.Name()
		origPath := path.Join(steamuiPath, fileName)

		if file.IsDir() || !strings.HasSuffix(fileName, ".orig.js") {
			continue
		}

		path := strings.Replace(origPath, ".orig.js", ".js", 1)

		log.Println("Writing original", fileName, origPath, path)
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

func useCachedPatchedScript(scriptPath, cacheDir, authToken string) (bool, string, error) {
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

	script, err := ioutil.ReadFile(cachedFilePath)
	if err != nil {
		return false, sumStr, err
	}

	// Update auth token
	re := regexp.MustCompile(`window\.csAuthToken = '.+';`)
	script = re.ReplaceAll(script, []byte(fmt.Sprintf(`window.csAuthToken = '%s';`, authToken)))

	err = ioutil.WriteFile(scriptPath, script, 0755)

	return true, sumStr, err
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
