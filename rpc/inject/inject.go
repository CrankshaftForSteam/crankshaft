package inject

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"git.sr.ht/~avery/crankshaft/build"
	"git.sr.ht/~avery/crankshaft/cdp"
	"git.sr.ht/~avery/crankshaft/plugins"
)

type InjectService struct {
	debugPort  string
	serverPort string
	plugins    *plugins.Plugins
	devMode    bool
	steamPath  string
}

func NewInjectService(debugPort, serverPort string, plugins *plugins.Plugins, devMode bool, steamPath string) *InjectService {
	return &InjectService{debugPort, serverPort, plugins, devMode, steamPath}
}

type InjectArgs struct{}

type InjectReply struct{}

func (service *InjectService) Inject(r *http.Request, req *InjectArgs, res *InjectReply) error {
	log.Println("Injecting scripts...")

	err := cdp.WaitForLibraryEl(service.debugPort)
	if err != nil {
		log.Println(err)
		return err
	}

	steamClient, err := cdp.NewSteamClient(service.debugPort)
	if err != nil {
		log.Println(err)
		return err
	}
	defer steamClient.Cancel()

	log.Println("Client mode:", steamClient.UiMode)

	// TODO: this code is awful and terrible aaaaaaaaaaaaaaaaaaaaa

	// Inject shared script

	if service.devMode {
		sharedScript, err = build.BundleSharedScripts()
		if err != nil {
			log.Println(err)
			return fmt.Errorf("Failed to build shared scripts: %v", err)
		}
	}

	err = steamClient.RunScriptInLibrary(sharedScript)
	if steamClient.UiMode == cdp.UIModeDeck {
		err = steamClient.RunScriptInMenu(sharedScript)
	}
	if err != nil {
		log.Println(err)
		return fmt.Errorf("Error injecting shared script: %v", err)
	}

	// Inject plugins

	// TODO: Sleeping briefly here seems to fix plugins sometimes not loading in
	// desktop mode. Need to investigate further
	time.Sleep(1 * time.Second)

	for _, plugin := range service.plugins.PluginMap {
		if err := injectPlugin(steamClient, plugin); err != nil {
			log.Println(err)
			return err
		}
	}

	// Inject library script

	var libraryEvalScript string
	if service.devMode {
		libraryEvalScript, err = build.BuildEvalScriptFromFile(service.serverPort, steamClient.UiMode, ".build/library.js", service.steamPath)
	} else {
		libraryEvalScript, err = build.BuildEvalScript(service.serverPort, steamClient.UiMode, libraryScript, service.steamPath)
	}
	if err != nil {
		log.Println(err)
		return fmt.Errorf("Failed to build library eval script: %w", err)
	}

	if err := steamClient.RunScriptInLibrary(libraryEvalScript); err != nil {
		log.Println(err)
		return fmt.Errorf("Error injecting library script: %w", err)
	}

	// Inject menu script

	if steamClient.UiMode == cdp.UIModeDeck {
		var menuEvalScript string
		if service.devMode {
			menuEvalScript, err = build.BuildEvalScriptFromFile(service.serverPort, steamClient.UiMode, ".build/menu.js", service.steamPath)
		} else {
			menuEvalScript, err = build.BuildEvalScript(service.serverPort, steamClient.UiMode, menuScript, service.steamPath)
		}
		if err != nil {
			log.Println(err)
			return fmt.Errorf("Failed to build menu eval script: %w", err)
		}

		if err := steamClient.RunScriptInMenu(menuEvalScript); err != nil {
			log.Println(err)
			return fmt.Errorf("Error injecting menu script: %w", err)
		}
	}

	return nil
}
