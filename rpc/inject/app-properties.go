package inject

import (
	"bytes"
	"errors"
	"fmt"
	"log"
	"net/http"
	"text/template"

	"git.sr.ht/~avery/crankshaft/build"
	"git.sr.ht/~avery/crankshaft/cdp"
)

type InjectAppPropertiesArgs struct {
	App   string `json:"app"`
	Title string `json:"title"`
}

type InjectAppPropertiesReply struct{}

var appPropertiesScriptTemplate = template.Must(template.New("app-properties").Parse(`
	window.appPropertiesApp = JSON.parse(` + "`{{ .App }}`" + `);
	{{ .Script }}
`))

func (service *InjectService) InjectAppProperties(r *http.Request, req *InjectAppPropertiesArgs, res *InjectAppPropertiesReply) error {
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

	if err = steamClient.RunScriptInAppProperties(sharedScript, req.Title); err != nil {
		log.Println(err)
		return fmt.Errorf("Error injecting shared script: %v", err)
	}

	// App properties script

	var appPropertiesEvalScript string
	if service.devMode {
		appPropertiesEvalScript, err = build.BuildEvalScriptFromFile(
			service.serverPort,
			steamClient.UiMode,
			".build/app-properties.js",
			service.steamPath,
			service.authToken,
			service.pluginsDir,
		)
	} else {
		appPropertiesEvalScript, err = build.BuildEvalScript(
			service.serverPort,
			steamClient.UiMode,
			appPropertiesScript,
			service.steamPath,
			service.authToken,
			service.pluginsDir,
		)
	}
	if err != nil {
		log.Println(err)
		return fmt.Errorf("Failed to build app properties eval script: %w", err)
	}

	var scriptBytes bytes.Buffer
	if err := appPropertiesScriptTemplate.Execute(&scriptBytes, struct {
		App    string
		Script string
	}{
		App:    req.App,
		Script: appPropertiesEvalScript,
	}); err != nil {
		return err
	}

	if err := steamClient.RunScriptInAppProperties(scriptBytes.String(), req.Title); err != nil {
		log.Println(err)
		return fmt.Errorf("Error injecting app properties script: %w", err)
	}

	return nil
}
