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

func patchSP(scriptPath string) error {
	log.Printf("Patching %s...\n", scriptPath)

	checkForOriginal(scriptPath)

	if err := copyOriginal(scriptPath); err != nil {
		return err
	}

	unminFilePath, err := unmin(scriptPath)
	if err != nil {
		return err
	}

	fileLines, err := pathutil.FileLines(unminFilePath)
	if err != nil {
		return err
	}

	fileLines, react, err := patchMenuItems(fileLines)
	if err != nil {
		return err
	}

	fileLines, err = patchQuickAccessItems(fileLines, react)
	if err != nil {
		return err
	}

	fileLines[0] = "// file patched by crankshaft\n" + fileLines[0]

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
patchMenuItems patches the Steam Deck UI to support loading arbitrary main menu
items.
*/
func patchMenuItems(fileLines []string) ([]string, string, error) {
	log.Println("Patching main menu...")

	// Find settings tab, menu items will be added below it
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
		return nil, "", errors.New("Didn't find MainTabsSettings")
	}

	// Find power menu item
	powerExp := regexp.MustCompile(`label:.*"#Power"`)
	powerLineNum := -1
	for i, line := range fileLines {
		if match := powerExp.MatchString(line); match {
			powerLineNum = i
			break
		}
	}
	if powerLineNum == -1 {
		return nil, "", errors.New("Didn't find Power")
	}

	// Find createElement for power menu item
	// We'll use this component for custom menu items
	createElementExp := regexp.MustCompile(`^.*(\w+\.\w+\.createElement\(.+,).*$`)
	var createElementStr string
	for i := powerLineNum - 1; i >= powerLineNum-10; i-- {
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
						active: window.csMenuActiveItem && window.csMenuActiveItem === item.id,
						action: () => {
							smm.IPC.send('csMenuItemClicked', { id: item.id });
						},
					}
				)),
			` + line[insertCol:]
			fileLines[i] = newLine
			found = true
			break
		}
	}
	if !found {
		return nil, "", errors.New("Menu items location not found")
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
		return nil, "", errors.New("React not found")
	}

	// Add a callback to force this component to rerender the main menu
	fileLines[returnLineNum] = fmt.Sprintf(`
		const [, updateState] = %[1]s.useState();
		window.csMenuUpdate = %[1]s.useCallback(() => {
			updateState({});
		}, [updateState]);

		%[1]s.useEffect(() => {
			console.log('Making request to inject service...');
			fetch('http://localhost:8085/rpc', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: String(new Date().getTime()),
					method: 'InjectService.InjectMenu',
					params: [{}],
				}),
			});
		}, []);

	`, react) + fileLines[returnLineNum]

	// Patch active menu items
	activePropExp := regexp.MustCompile(`\[.*"route".*\]`)
	activePropLineNum := -1
	for i := settingsLineNum - 1; i >= settingsLineNum-500; i-- {
		if match := activePropExp.MatchString(fileLines[i]); match {
			activePropLineNum = i
			break
		}
	}
	if activePropLineNum == -1 {
		return nil, "", errors.New("route prop not found")
	}

	found = false
	for i := activePropLineNum + 1; i <= activePropLineNum+20; i++ {
		if strings.Contains(fileLines[i], "active:") {
			fileLines[i] = strings.Replace(fileLines[i], "active:", `active: window.csMenuActiveItem ? false : `, 1)
			found = true
			break
		}
	}
	if !found {
		return nil, "", errors.New("active not found")
	}

	return fileLines, react, nil
}

/*
patchQuickAccessItems patches the Steam Deck UI to support loading arbitrary
quick access menu items.
*/
func patchQuickAccessItems(fileLines []string, react string) ([]string, error) {
	log.Println("Patching quick access...")

	settingsLineNum := 0
	for _, line := range fileLines {
		settingsLineNum++
		if strings.Contains(line, "#QuickAccess_Tab_Settings_Title") {
			break
		}
	}
	if !(settingsLineNum > 0) {
		return nil, errors.New("Settings tab not found")
	}

	fmt.Println("settingsLineNum", settingsLineNum)

	settingsTabComponentExp := regexp.MustCompile(`^\s*tab: .*createElement\((.+), .+\)`)
	var settingsTabComponent string
	for i := settingsLineNum; i < settingsLineNum+4; i++ {
		line := fileLines[i]
		matches := settingsTabComponentExp.FindStringSubmatch(line)
		if len(matches) > 0 {
			settingsTabComponent = matches[1]
		}
	}
	if settingsTabComponent == "" {
		return nil, errors.New("settingsTabComponent not found")
	}

	fmt.Println("settingsTabComponent", settingsTabComponent)

	// Find end of tabs array
	for i := settingsLineNum + 5; i < settingsLineNum+40; i++ {
		line := strings.TrimSpace(fileLines[i])
		if strings.HasPrefix(line, "}].filter") {
			fileLines[i] = fmt.Sprintf(`}, ...(
				(window.csQuickAccessItems || []).map((item) => ({
					key: item.id,
					title: %[1]s.createElement(%[1]s.Fragment, null),
					tab: %[1]s.createElement(%[2]s, null),
					panel: %[1]s.createElement(
						'div',
						{
							'data-cs-quick-access-item': item.id,
						},
					),
				}))
			)%[03]s
				const [, updateState] = %[1]s.useState();
				window.csQuickAccessUpdate = %[1]s.useCallback(() => {
					updateState({});
				}, [updateState]);

				%[1]s.useEffect(() => {
					console.log('Making request to inject service...');
					fetch('http://localhost:8085/rpc', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							id: String(new Date().getTime()),
							method: 'InjectService.InjectQuickAccess',
							params: [{}],
						}),
					});
				}, []);
			`, react, settingsTabComponent, strings.TrimPrefix(line, "}"))
			break
		}
	}

	return fileLines, nil
}
