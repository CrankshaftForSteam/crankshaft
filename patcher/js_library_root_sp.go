package patcher

import (
	"errors"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"

	"git.sr.ht/~avery/crankshaft/pathutil"
)

func patchLibraryRootSP(scriptPath, serverPort string) error {
	log.Printf("Patching %s...\n", scriptPath)

	checkForOriginal(scriptPath)

	// TODO: use checksum to cache output
	// f, _ := os.Open(scriptPath)
	// defer f.Close()
	// h := md5.New()
	// io.Copy(h, f)
	// log.Printf("%x\n", h.Sum(nil))

	// Make a copy of the original, just in case
	if err := copyOriginal(scriptPath); err != nil {
		return err
	}

	unminFilePath, err := unmin(scriptPath)
	if err != nil {
		return err
	}

	// Read the entire file into memory as fileLines for searching and manipulation,
	// then at the end overwrite the original
	fileLines, err := pathutil.FileLines(unminFilePath)
	if err != nil {
		return err
	}

	fileLines, err = patchCoolClass(fileLines, scriptPath, serverPort)
	if err != nil {
		return err
	}

	fileLines, err = addButtonInterceptor(fileLines)
	if err != nil {
		return err
	}

	fileLines, err = appPropertiesEvent(fileLines)
	if err != nil {
		return err
	}

	log.Printf("Writing patched file to %s\n", scriptPath)

	f, err := os.OpenFile(scriptPath, os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = f.WriteString(strings.Join(fileLines, "\n"))
	if err != nil {
		return err
	}

	return nil
}

/*
patchCoolClass patches a Steam client script to expose internal functionality.

More specifically, it attaches an instance of a specific class to the window so
that Crankshaft scripts can access it. I don't know exactly what the class
does, and the name is minified, but it exposes a lot of cool stuff, so lets
call it coolClass.
*/
func patchCoolClass(fileLines []string, origPath string, serverPort string) ([]string, error) {
	constructorLineNum := -1
	constructorLineNum, err := findCoolClassConstructor(fileLines)
	if err != nil {
		log.Println("Error finding constructor:", err)
		// TODO: handle these errors properly (for non-SP branch)
		// return err
	}

	// Add our code

	if constructorLineNum > -1 {
		insertAtPos(&fileLines, constructorLineNum, "window.coolClass = this;")
	}

	script := fmt.Sprintf(`// file patched by crankshaft
		console.info('[Crankshaft] Loading patched libraryroot~sp.js');

		window.addEventListener('load', () => {
			console.info('[Crankshaft] Page loading, making request to inject service');
			fetch('http://localhost:%s/rpc', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					method: 'InjectService.InjectLibrary',
					params: [],
					id: Date.now(),
				}),
			})
		});
	`, serverPort)
	insertAtPos(&fileLines, 0, script)

	return fileLines, nil
}

// findCoolClassConstructor finds which line the constructor for coolClass is
// on.
func findCoolClassConstructor(fileLines []string) (int, error) {
	// First we find a method in the class
	methodExp := regexp.MustCompile(`ExcludedTitlesForPlatform\(.*\) \{`)
	lineNum := 0
	for _, line := range fileLines {
		lineNum++
		if match := methodExp.MatchString(line); match {
			break
		}
	}

	// Loop over the file backwards, starting from the matched method. We want to
	// find the constructor for the class the method was in
	constructorExp := regexp.MustCompile(`constructor\(.*\) \{`)
	for i := lineNum - 1; i >= 0; i-- {
		if match := constructorExp.MatchString(fileLines[i]); match {
			return i + 1, nil
		}
	}

	return 0, fmt.Errorf("constructor not found")
}

func addButtonInterceptor(fileLines []string) ([]string, error) {
	onButtonDownExp := regexp.MustCompile(`OnButtonDown\((\S+),.+\) {`)
	found := false
	for i, line := range fileLines {
		matches := onButtonDownExp.FindStringSubmatch(line)
		if len(matches) >= 2 {
			found = true

			eventCodeArg := matches[1]

			fileLines[i] = line + `
				if (window.csButtonInterceptors) {
					for (const { handler } of window.csButtonInterceptors) {
						if (handler(` + eventCodeArg + `)) {
							return;
						}
					}
				}
			`

			break
		}
	}
	if !found {
		log.Println("Didn't find OnButtonDown")
	}

	return fileLines, nil
}

func appPropertiesEvent(fileLines []string) ([]string, error) {
	titleLine := -1
	for i, line := range fileLines {
		if strings.Contains(line, "#AppProperties_ShortcutPage") {
			titleLine = i
			break
		}
	}

	if titleLine < 0 {
		return nil, errors.New("Didn't find app properties title line")
	}

	getAppPropsLine := regexp.MustCompile(`GetAppOverviewByAppID\(([a-zA-Z0-9]+)\)`)

	found := false
	appId := ""
	for i := titleLine - 1; i >= titleLine-15; i-- {
		line := fileLines[i]

		matches := getAppPropsLine.FindStringSubmatch(line)
		if len(matches) >= 2 {
			found = true
			appId = matches[1]
			break
		}
	}

	if !found {
		return nil, errors.New("Didn't find GetAppOverviewByAppID")
	}

	for i := titleLine - 1; i >= titleLine-10; i-- {
		line := fileLines[i]
		if strings.HasPrefix(strings.TrimSpace(line), "return") {
			found = true
			fileLines[i] = fmt.Sprintf("smm.switchToAppProperties(%s);\n", appId) + fileLines[i]
			break
		}
	}

	if !found {
		return nil, errors.New("Didn't find return")
	}

	return fileLines, nil
}
