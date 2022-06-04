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

// ShowLoadingIndicator shows a Crankshaft loading indicator in Steam.
func ShowLoadingIndicator(debugPort string) error {
	sc, err := NewSteamClient(debugPort)
	if err != nil {
		return err
	}
	defer sc.Cancel()

	var specificIndicatorStyles string
	if sc.UiMode == UIModeDeck {
		specificIndicatorStyles = `
			right: 0;
			bottom: 40px;
			border-top-left-radius: 8px;
		`
	} else {
		specificIndicatorStyles = `
			right: 0;
			top: 0;
			border-bottom-left-radius: 8px;
		`
	}

	sc.RunScriptInLibrary(`
    document.querySelectorAll('[data-cs-init-loading-indicator]').forEach((node) => node.remove());

    styles = document.createElement('style');
    styles.dataset.csInitLoadingIndicator = '';
    styles.type = 'text/css';
    styles.appendChild(document.createTextNode(` + "`" + `
			.cs-init-loading-indicator {
			    position: absolute;
			    z-index: 999;

			    display: flex;
			    padding: 8px 12px;
			    background-color: #23262e;
			    color: white;

			    ` + specificIndicatorStyles + `
			}

			@keyframes cs-loading-indicator-spin {
			  to {
			    transform: rotate(360deg);
			  }
			}

			.cs-init-loading-indicator-spinner {
			    display: inline-block;
			    width: 16px;
			    height: 16px;
			    margin-right: 8px;
			    border: solid 2.5px transparent;
			    border-radius: 50%;
			    border-right-color: #009aff;
			    animation: cs-loading-indicator-spin 1s infinite linear;
			}
    ` + "`" + `));
    document.head.appendChild(styles);

    loading = document.createElement('div');
    loading.classList.add('cs-init-loading-indicator');
    loading.dataset.csInitLoadingIndicator = '';

    spinner = document.createElement('span');
    spinner.classList.add('cs-init-loading-indicator-spinner');
    
    loading.appendChild(spinner);
    loading.appendChild(document.createTextNode('Loading Crankshaft...'));

    document.body.appendChild(loading);
  `)

	return nil
}
