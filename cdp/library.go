package cdp

import (
	"fmt"
	"log"
)

func WaitForLibraryEl(debugPort string) error {
	log.Println("Waiting for Library...")
	sc, err := NewSteamClient(debugPort)
	if err != nil {
		return err
	}
	defer sc.Cancel()

	selector := `[class^=library_AppDetailsMain]`
	if sc.UiMode == UIModeDeck {
		selector = `[class^=gamepadui_Content]`
	}

	script := fmt.Sprintf(`
		new Promise((resolve) => {
			if (document.querySelector('%s')) {
				resolve();
			}

			const observer = new MutationObserver(() => {
				if (document.querySelector('%s')) {
					resolve();
				}
			});
			observer.observe(document, { subtree: true, childList: true });
		});
	`, selector, selector)

	sc.RunScriptInLibrary(script)

	log.Println("Library found!")
	return nil
}

// Wait for the video element to be removed in the event a startup video is enabled
func WaitForVideoFinish(debugPort string) error {
	sc, err := NewSteamClient(debugPort)
	if err != nil {
		return err
	}
	defer sc.Cancel()

	// We don't need to worry about this on desktop mode
	if sc.UiMode != UIModeDeck {
		return nil
	}

	log.Println("Waiting for video to finish...")
	selector := `[class^=steamdeckbootupthrobber_Container]`
	script := fmt.Sprintf(`
		new Promise((resolve) => {
			if (!document.querySelector('%s')) {
				resolve();
			}

			const observer = new MutationObserver(() => {
				if (!document.querySelector('%s')) {
					resolve();
				}
			});
			observer.observe(document, { subtree: true, childList: true });
		});
	`, selector, selector)

	sc.RunScriptInLibrary(script)

	log.Println("Video finished!")
	return nil
}

// ShowLoadingIndicator shows a Crankshaft loading indicator in Steam.
func ShowLoadingIndicator(debugPort, serverPort, authToken string) error {
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
			box-shadow: -2px -2px 10px 2px rgb(0 0 0 / 20%);
		`
	} else {
		specificIndicatorStyles = `
			right: 0;
			top: 0;
			border-bottom-left-radius: 8px;
			box-shadow: -2px 2px 10px 2px rgb(0 0 0 / 20%);
		`
	}

	sc.RunScriptInLibrary(fmt.Sprintf(`
    document.querySelectorAll('[data-cs-init-loading-indicator]').forEach((node) => node.remove());

    styles = document.createElement('style');
    styles.dataset.csInitLoadingIndicator = '';
    styles.type = 'text/css';
    styles.appendChild(document.createTextNode(`+"`"+`
			.cs-init-loading-indicator {
			    position: absolute;
			    z-index: 999;

			    display: flex;
			    padding: 8px 12px;
			    background-color: #23262e;
			    color: white;
			    cursor: pointer;
			    user-select: none;
			    transition: opacity 3s;

			    %[1]s
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
			    border-radius: 50%%;
			    border-right-color: #009aff;
			    animation: cs-loading-indicator-spin 1s infinite linear;
			}
    `+"`"+`));
    document.head.appendChild(styles);

    loading = document.createElement('div');
    loading.classList.add('cs-init-loading-indicator');
    loading.dataset.csInitLoadingIndicator = '';

    spinner = document.createElement('span');
    spinner.classList.add('cs-init-loading-indicator-spinner');
    
    loading.appendChild(spinner);
    loading.appendChild(document.createTextNode('Loading Crankshaft...'));

    document.body.appendChild(loading);

    // Cancel loading on double click
    loading.addEventListener('click', (event) => {
    	if (event.detail === 2) {
    		console.log('Loading indicator double clicked, stopping Crankshaft');

    		// Stop Systemd service
    		fetch('http://localhost:%[2]s/rpc', {
    			method: 'POST',
    			headers: {
    				'Content-Type': 'application/json',
    				'X-Cs-Auth': '%[3]s',
    			},
    			body: JSON.stringify({
    				id: String(new Date().getTime() + Math.random()),
    				method: 'ExecService.Run',
    				params: [{
    					command: 'systemctl',
    					args: ['--user', 'stop', 'crankshaft.service'],
    				}],
    			}),
    		});

    		// Stop processes (will still be running if not using Systemd)
    		fetch('http://localhost:%[2]s/rpc', {
    			method: 'POST',
    			headers: {
    				'Content-Type': 'application/json',
    				'X-Cs-Auth': '%[3]s',
    			},
    			body: JSON.stringify({
    				id: String(new Date().getTime() + Math.random()),
    				method: 'ExecService.Run',
    				params: [{
    					command: 'pkill',
    					args: ['--signal', 'SIGINT', 'crankshaft'],
    				}],
    			}),
    		});

    		// Indicate to user
    		loading.innerHTML = 'Loading Crankshaft cancelled.';
    		loading.style.backgroundColor = 'rgb(209, 28, 28)';
    		// Fade out
    		setTimeout(() => {
	    		loading.addEventListener('transitionend', () => loading.remove());
	    		loading.style.opacity = '0';
	    	}, 2000);
    	}
    });
  `, specificIndicatorStyles, serverPort, authToken))

	return nil
}
