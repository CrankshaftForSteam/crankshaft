package inject

import (
	"errors"
	"fmt"
	"log"
	"net/http"

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

func (service *InjectService) InjectLibrary(r *http.Request, req *InjectArgs, res *InjectReply) error {
	log.Println("Injecting library scripts...")

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

	// Inject shared script

	if service.devMode {
		sharedScript, err = build.BundleSharedScripts()
		if err != nil {
			log.Println(err)
			return fmt.Errorf("Failed to build shared scripts: %v", err)
		}
	}

	err = steamClient.RunScriptInLibrary(sharedScript)
	if err != nil {
		log.Println(err)
		return fmt.Errorf("Error injecting shared script: %v", err)
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

	return nil
}

func (service *InjectService) InjectMenu(r *http.Request, req *InjectArgs, res *InjectReply) error {
	log.Println("Injecting menu scripts...")

	steamClient, err := cdp.NewSteamClient(service.debugPort)
	if err != nil {
		log.Println(err)
		return err
	}
	defer steamClient.Cancel()

	if steamClient.UiMode != cdp.UIModeDeck {
		return errors.New("Not running in Deck mode, but got request to inject menu scripts")
	}

	// Shared script

	if service.devMode {
		sharedScript, err = build.BundleSharedScripts()
		if err != nil {
			log.Println(err)
			return fmt.Errorf("Failed to build shared scripts: %v", err)
		}
	}

	err = steamClient.RunScriptInMenu(sharedScript)
	if err != nil {
		log.Println(err)
		return fmt.Errorf("Error injecting shared script: %v", err)
	}

	// Menu script

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

	return nil
}

func (service *InjectService) InjectQuickAccess(r *http.Request, req *InjectArgs, res *InjectReply) error {
	log.Println("Injecting quick access scripts...")

	steamClient, err := cdp.NewSteamClient(service.debugPort)
	if err != nil {
		log.Println(err)
		return err
	}
	defer steamClient.Cancel()

	if steamClient.UiMode != cdp.UIModeDeck {
		return errors.New("Not running in Deck mode, but got request to inject quick access scripts")
	}

	// Shared script

	if service.devMode {
		sharedScript, err = build.BundleSharedScripts()
		if err != nil {
			log.Println(err)
			return fmt.Errorf("Failed to build shared scripts: %v", err)
		}
	}

	err = steamClient.RunScriptInQuickAccess(sharedScript)
	if err != nil {
		log.Println(err)
		return fmt.Errorf("Error injecting shared script: %v", err)
	}

	// Quick access script

	var quickAccessEvalScript string
	if service.devMode {
		quickAccessEvalScript, err = build.BuildEvalScriptFromFile(service.serverPort, steamClient.UiMode, ".build/quick-access.js", service.steamPath)
	} else {
		quickAccessEvalScript, err = build.BuildEvalScript(service.serverPort, steamClient.UiMode, quickAccessScript, service.steamPath)
	}
	if err != nil {
		log.Println(err)
		return fmt.Errorf("Failed to build quick access eval script: %w", err)
	}

	if err := steamClient.RunScriptInQuickAccess(quickAccessEvalScript); err != nil {
		log.Println(err)
		return fmt.Errorf("Error injecting quick access script: %w", err)
	}

	return nil
}
