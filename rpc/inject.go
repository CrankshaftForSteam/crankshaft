package rpc

import (
	"fmt"
	"net/http"

	"git.sr.ht/~avery/steam-mod-manager/build"
	"git.sr.ht/~avery/steam-mod-manager/cdp"
)

type InjectService struct {
	debugPort  string
	serverPort string
}

func NewInjectService(debugPort, serverPort string) *InjectService {
	return &InjectService{debugPort, serverPort}
}

type InjectArgs struct{}

type InjectReply struct{}

func (service *InjectService) Inject(r *http.Request, req *InjectArgs, res *InjectReply) error {
	fmt.Println("Injecting scripts...")

	err := cdp.WaitForLibraryEl(service.debugPort)
	if err != nil {
		return err
	}

	steamClient, err := cdp.NewSteamClient(service.debugPort)
	if err != nil {
		return err
	}
	defer steamClient.Cancel()

	fmt.Println("Client mode:", steamClient.UiMode)

	libraryEvalScript, err := build.BuildEvalScript(service.serverPort, steamClient.UiMode, ".build/library.js")
	if err != nil {
		return fmt.Errorf("Failed to build library eval script: %w", err)
	}
	if err := steamClient.RunScriptInLibrary(libraryEvalScript); err != nil {
		return fmt.Errorf("Error injecting library script: %w", err)
	}

	if steamClient.UiMode == cdp.UIModeDeck {
		menuEvalScript, err := build.BuildEvalScript(service.serverPort, steamClient.UiMode, ".build/menu.js")
		if err != nil {
			return fmt.Errorf("Failed to build menu eval script: %w", err)
		}
		if err := steamClient.RunScriptInMenu(menuEvalScript); err != nil {
			return fmt.Errorf("Error injecting menu script: %w", err)
		}
	}

	return nil
}
