package patcher

import (
	"errors"
	"fmt"
	"os"
	"regexp"
	"strings"

	"git.sr.ht/~avery/crankshaft/pathutil"
)

func patchSP(scriptPath string) error {
	fmt.Printf("Patching %s...\n", scriptPath)

	checkForOriginal(scriptPath)

	if err := copyOriginal(scriptPath); err != nil {
		return err
	}

	unminFilePath, err := unmin(scriptPath)
	if err != nil {
		return err
	}

	if err := patchMenuItems(unminFilePath, scriptPath); err != nil {
		return err
	}

	return nil
}

/*
patchMenuItems patches the Steam Deck UI to support loading arbitrary main menu
items.
*/
func patchMenuItems(unminPath, origPath string) error {
	fmt.Printf("Patching main menu in %s\n", unminPath)

	fileLines, err := pathutil.FileLines(unminPath)
	if err != nil {
		return err
	}

	mainTabsHomeExp := regexp.MustCompile(`label:.*"#MainTabsSettings"`)
	settingsLineNum := 0
	found := false
	for _, line := range fileLines {
		settingsLineNum++
		if match := mainTabsHomeExp.MatchString(line); match {
			found = true
			break
		}
	}
	if !found {
		return errors.New("Didn't find MainTabsSettings")
	}

	createElementExp := regexp.MustCompile(`^.*(\w+\.\w+\.createElement\(.+,).*$`)
	var createElementStr string
	for i := settingsLineNum - 1; i >= settingsLineNum-10; i-- {
		matches := createElementExp.FindStringSubmatch(fileLines[i])
		if len(matches) > 0 {
			createElementStr = matches[1]
			break
		}
	}

	found = false
	for i := settingsLineNum; i < settingsLineNum+10; i++ {
		line := fileLines[i]
		if strings.Contains(line, "createElement") {
			insertCol := strings.LastIndex(line, ")") + 2
			// Add a place to render custom menu items
			newLine := line[:insertCol] + " " + `(window.csMenuItems || []).map(
				(item) => ` + createElementStr + `
					{
						label: item.label,
					}
				)),
			` + line[insertCol:]
			fileLines[i] = newLine
			found = true
			break
		}
	}
	if !found {
		return errors.New("Menu items location not found")
	}

	returnExp := regexp.MustCompile(`return.*(\w+\.\w+)\.createElement`)
	returnLineNum := -1
	var react string
	for i := settingsLineNum - 1; i >= settingsLineNum-50; i-- {
		matches := returnExp.FindStringSubmatch(fileLines[i])
		if len(matches) > 0 {
			react = matches[1]
			returnLineNum = i
			break
		}
	}
	if returnLineNum == -1 {
		return errors.New("React not found")
	}

	// Add a callback to force this component to rerender
	fileLines[returnLineNum] = fmt.Sprintf(`
		const [, updateState] = %[1]s.useState();
		window.csMenuUpdate = %[1]s.useCallback(() => {
			updateState({});
		}, [updateState]);

	`, react) + fileLines[returnLineNum]

	fileLines[0] = "// file patched by crankshaft\n" + fileLines[0]

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
