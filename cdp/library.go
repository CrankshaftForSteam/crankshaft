package cdp

import "fmt"

func WaitForLibraryEl(debugPort string) error {
	sc, err := NewSteamClient(debugPort)
	if err != nil {
		return err
	}
	defer sc.Cancel()

	selector := `[class^=library_AppDetailsMain]`
	if sc.UiMode == UIModeDeck {
		selector = `[class^=basiclibrary_TopLevelTransitionSwitch]`
	}

	script := fmt.Sprintf(`
		new Promise((resolve) => {
			if (document.querySelector(%s)) {
				resolve();
			}

			const observer = new MutationObserver(() => {
				if (document.querySelector(%s)) {
					resolve();
				}
			});
			observer.observe(document, { subtree: true, childList: true });
		});
	`, selector, selector)

	sc.RunScriptInLibrary(script)

	return nil
}
