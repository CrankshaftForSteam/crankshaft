package patcher

import (
	"fmt"
	"os"
	"regexp"
	"strings"

	"git.sr.ht/~avery/crankshaft/pathutil"
)

func patchLibraryRootSP(scriptPath, serverPort string) error {
	fmt.Printf("Patching %s...\n", scriptPath)

	checkForOriginal(scriptPath)

	// TODO: use checksum to cache output
	// f, _ := os.Open(scriptPath)
	// defer f.Close()
	// h := md5.New()
	// io.Copy(h, f)
	// fmt.Printf("%x\n", h.Sum(nil))

	// Make a copy of the original, just in case
	if err := copyOriginal(scriptPath); err != nil {
		return err
	}

	unminFilePath, err := unmin(scriptPath)
	if err != nil {
		return err
	}

	err = patchCoolClass(unminFilePath, scriptPath, serverPort)
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
func patchCoolClass(unminPath string, origPath string, serverPort string) error {
	fmt.Printf("Patching class in %s\n", unminPath)

	// Read the entire file into memory as fileLines for searching and manipulation,
	// then at the end overwrite the original
	fileLines, err := pathutil.FileLines(unminPath)
	if err != nil {
		return err
	}

	constructorLineNum := -1
	constructorLineNum, err = findCoolClassConstructor(fileLines)
	if err != nil {
		fmt.Println("Error finding constructor:", err)
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
					method: 'InjectService.Inject',
					params: [],
					id: Date.now(),
				}),
			})
		});
	`, serverPort)
	insertAtPos(&fileLines, 0, script)

	fmt.Printf("Writing patched file to %s\n", origPath)

	f, err := os.OpenFile(origPath, os.O_WRONLY|os.O_TRUNC, 0755)
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

// findCoolClassConstructor finds which line the constructor for coolClass is
// on.
func findCoolClassConstructor(fileLines []string) (int, error) {
	// First we find a method in the class
	methodExp := regexp.MustCompile(`OpenQuickAccessMenu\(.*\) \{`)
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
