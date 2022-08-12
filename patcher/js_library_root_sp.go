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

func patchLibraryRootSP(scriptPath, serverPort, cacheDir string, noCache bool, authToken string) error {
	log.Printf("Patching %s...\n", scriptPath)

	if err := checkForOriginal(scriptPath); err != nil {
		return err
	}

	// Make a copy of the original, just in case
	if err := copyOriginal(scriptPath); err != nil {
		return err
	}

	origSum := ""

	if !noCache {
		found, _origSum, err := useCachedPatchedScript(scriptPath, cacheDir, authToken)
		if err != nil {
			return err
		}

		if found {
			return nil
		}

		origSum = _origSum
	} else {
		log.Println("Skipping cache...")
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

	fileLines, err = patchCoolClass(fileLines, scriptPath, serverPort, authToken)
	if err != nil {
		return err
	}

	fileLines, err = addButtonInterceptor(fileLines)
	if err != nil {
		return err
	}

	fileLines, err = appProperties(fileLines)
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

	if !noCache {
		err = cachePatchedScript(fileLines, scriptPath, cacheDir, origSum)
	} else {
		log.Println("Skipping cache...")
	}

	return err
}

/*
patchCoolClass patches a Steam client script to expose internal functionality.

More specifically, it attaches an instance of a specific class to the window so
that Crankshaft scripts can access it. I don't know exactly what the class
does, and the name is minified, but it exposes a lot of cool stuff, so lets
call it coolClass.
*/
func patchCoolClass(fileLines []string, origPath, serverPort, authToken string) ([]string, error) {
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
		window.csAuthToken = '%[2]s';
		console.info('[Crankshaft] Loading patched libraryroot~sp.js');

		window.addEventListener('load', () => {
			console.info('[Crankshaft] Page loading, making request to inject service');
			fetch('http://localhost:%[1]s/rpc', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
    			'X-Cs-Auth': window.csAuthToken,
				},
				body: JSON.stringify({
					method: 'InjectService.InjectLibrary',
					params: [],
					id: Date.now(),
				}),
			})
		});
	`, serverPort, authToken)
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
					for (const { handler } of [...window.csButtonInterceptors].reverse()) {
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

func appProperties(fileLines []string) ([]string, error) {
	firstItemLine := -1
	for i, line := range fileLines {
		if strings.Contains(line, "#AppProperties_ShortcutPage") {
			firstItemLine = i
			break
		}
	}

	if firstItemLine < 0 {
		return nil, errors.New("Didn't find app properties first item line")
	}

	getAppPropsLine := regexp.MustCompile(`\s([a-zA-Z0-9]+)\.app_type`)

	found := false
	app := ""
	for i := firstItemLine - 1; i >= firstItemLine-5; i-- {
		line := fileLines[i]

		matches := getAppPropsLine.FindStringSubmatch(line)
		if len(matches) >= 2 {
			found = true
			app = matches[1]
			break
		}
	}

	if !found {
		return nil, errors.New("Didn't find app")
	}

	createElementRe := regexp.MustCompile(` ([a-zA-Z0-9]+)\.createElement`)
	react := ""
	for i := firstItemLine; i < firstItemLine+20; i++ {
		line := fileLines[i]

		if matches := createElementRe.FindStringSubmatch(line); len(matches) >= 2 {
			react = matches[1]
			break
		}
	}

	if react == "" {
		return nil, errors.New("Didn't find createElementRe")
	}

	for i := firstItemLine - 1; i >= firstItemLine-10; i-- {
		line := fileLines[i]
		if strings.HasPrefix(strings.TrimSpace(line), "return") {
			found = true
			fileLines[i] = fmt.Sprintf(`
				const [, updateState] = %[1]s.useState();
				window.csAppPropsMenuUpdate = %[1]s.useCallback(() => {
					updateState({});
				}, [updateState]);
			`, react) + fileLines[i]
			break
		}
	}

	if !found {
		return nil, errors.New("Didn't find return")
	}

	feedbackLine := -1
	for i, line := range fileLines {
		if strings.Contains(line, `"#AppProperties_FeedbackPage"`) {
			feedbackLine = i
			break
		}
	}
	if feedbackLine < 0 {
		return nil, errors.New("Didn't find feedback line")
	}

	itemsExp := regexp.MustCompile(`\S ([a-zA-Z0-9]+)\.push\(\{`)
	items := ""
	for i := feedbackLine - 1; i > feedbackLine-3; i-- {
		line := fileLines[i]

		if matches := itemsExp.FindStringSubmatch(line); len(matches) >= 2 {
			items = matches[1]
			break
		}
	}

	if items == "" {
		return nil, errors.New("Didn't find items")
	}

	matchRe := regexp.MustCompile(`^\s+className: .+AppProperties,$`)
	appPropsLine := -1
	for i := feedbackLine + 1; i < feedbackLine+15; i++ {
		if match := matchRe.MatchString(fileLines[i]); match {
			appPropsLine = i
			break
		}
	}
	if appPropsLine < 0 {
		return nil, errors.New("Didn't find appProps line")
	}

	createLine := -1
	for i := appPropsLine; i > appPropsLine-10; i-- {
		line := fileLines[i]
		if matches := createElementRe.FindStringSubmatch(line); len(matches) >= 2 {
			createLine = i
			break
		}
	}

	if createLine < 0 {
		return nil, errors.New("Didn't find create line")
	}

	line := strings.TrimSpace(fileLines[createLine])

	if !strings.HasPrefix(line, "})") {
		return nil, errors.New("Error patching app properties")
	}

	renderMenuItems := fmt.Sprintf(`(
		window.csGetAppPropsMenuItems
			? %[1]s.push(
					...(
						window.csGetAppPropsMenuItems()
							.map((item) => {
								return ({
									...item,
									link: "/app/"+%[2]s.appid+"/properties/"+item.id,
									route: "/app/:appid/properties/"+item.id,
									content: %[3]s.createElement('div', {
										"data-cs-plugin-id": item.id,
										"data-cs-plugin-data": JSON.stringify(%[2]s),
									}, null),
								});
							}
						)
					)
				)
			: undefined
	)`, items, app, react)

	fileLines[createLine] = "}), " + renderMenuItems + strings.TrimPrefix(line, "})")

	nonSteamPushRe := regexp.MustCompile(`^\s*\}\)\) : \(.+\.push\(`)
	for i := firstItemLine + 1; i <= firstItemLine+25; i++ {
		line := fileLines[i]
		if match := nonSteamPushRe.MatchString(line); match {
			fileLines[i] = "}), " + renderMenuItems + strings.TrimPrefix(strings.TrimSpace(fileLines[i]), "})")
			break
		}
	}

	titleLineRe := regexp.MustCompile(` ([a-zA-Z0-9]+) = .+"#AppProperties_Title"`)
	title := ""
	titleLine := -1
	for i, line := range fileLines {
		if matches := titleLineRe.FindStringSubmatch(line); len(matches) >= 2 {
			titleLine = i
			title = matches[1]
			break
		}
	}
	if titleLine < 0 || title == "" {
		return nil, errors.New("Title not found")
	}

	appId := ""
	appOverviewRe := regexp.MustCompile(`GetAppOverviewByAppID\(([a-zA-Z0-9]+)\)`)
	for i := titleLine; i >= titleLine-10; i-- {
		line := fileLines[i]
		if matches := appOverviewRe.FindStringSubmatch(line); len(matches) >= 2 {
			appId = matches[1]
			break
		}
	}
	if appId == "" {
		return nil, errors.New("App ID not found")
	}

	fileLines[titleLine] = fileLines[titleLine] + fmt.Sprintf(`
		smm.switchToAppProperties(%[1]s, %[2]s);
	`, appId, title)

	return fileLines, nil
}
