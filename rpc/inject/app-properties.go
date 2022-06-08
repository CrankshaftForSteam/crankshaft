package inject

import (
	"errors"
	"fmt"
	"log"
	"net/http"

	"git.sr.ht/~avery/crankshaft/build"
	"git.sr.ht/~avery/crankshaft/cdp"
)

func (service *InjectService) InjectAppProperties(r *http.Request, req *InjectArgs, res *InjectReply) error {
	log.Println("Injecting app properties scripts...")

	steamClient, err := cdp.NewSteamClient(service.debugPort)
	if err != nil {
		log.Println(err)
		return err
	}
	defer steamClient.Cancel()

	if steamClient.UiMode != cdp.UIModeDesktop {
		return errors.New("Separate app properties context only exists in desktop mode")
	}

	if service.devMode {
		sharedScript, err = build.BundleSharedScripts()
		if err != nil {
			log.Println(err)
			return fmt.Errorf("Failed to build shared scripts: %v", err)
		}
	}

	if err = steamClient.RunScriptInAppProperties(sharedScript); err != nil {
		log.Println(err)
		return fmt.Errorf("Error injecting shared script: %v", err)
	}

	// App properties script

	var appPropertiesEvalScript string
	if service.devMode {
		appPropertiesEvalScript, err = build.BuildEvalScriptFromFile(service.serverPort, steamClient.UiMode, ".build/app-properties.js", service.steamPath)
	} else {
		appPropertiesEvalScript, err = build.BuildEvalScript(service.serverPort, steamClient.UiMode, appPropertiesScript, service.steamPath)
	}
	if err != nil {
		log.Println(err)
		return fmt.Errorf("Failed to build app properties eval script: %w", err)
	}

	if err := steamClient.RunScriptInAppProperties(appPropertiesEvalScript); err != nil {
		log.Println(err)
		return fmt.Errorf("Error injecting app properties script: %w", err)
	}

	return nil
}
