package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"

	"git.sr.ht/~avery/steam-mod-manager/cdp"
	"git.sr.ht/~avery/steam-mod-manager/rpc"
	"github.com/gorilla/handlers"
)

const VERSION = "0.1.0"

func main() {
	if err := run(); err != nil {
		log.Fatalf("Error: %v", err)
	}
}

func run() error {
	debugPort := flag.String("debug-port", "8080", "CEF debug port")
	serverPort := flag.String("server-port", "8085", "Port to run HTTP/websocket server on")
	flag.Parse()

	ctx, cancel := cdp.GetSteamCtx(*debugPort)
	defer cancel()

	libraryCtx, uiMode, err := cdp.GetLibraryCtx(ctx)
	if err != nil {
		return fmt.Errorf("Error getting library context: %w", err)
	}

	var menuCtx context.Context
	if *uiMode == cdp.UIModeDeck {
		menuCtx, err = cdp.GetDeckMenuCtx(ctx)
		if err != nil {
			return fmt.Errorf("Error getting menu context: %w", err)
		}
	}

	bundleScripts()

	// TODO: have a system to load these dynamically
	// TODO: Right now you have to manually refresh Steam to get it to use the,
	// need to chromedp.Reload after patching
	// patcher.PatchSteamUiFile("libraryroot~sp.js", "./patches/open-quick-access.patch")

	libraryEvalScript, err := buildEvalScript(*serverPort, *uiMode, ".build/library.js")
	if err != nil {
		return fmt.Errorf("Failed to build library eval script: %w", err)
	}
	if err = cdp.RunScriptInCtx(libraryCtx, libraryEvalScript); err != nil {
		return fmt.Errorf("Error injecting library script: %w", err)
	}

	if *uiMode == cdp.UIModeDeck {
		menuEvalScript, err := buildEvalScript(*serverPort, *uiMode, ".build/menu.js")
		if err != nil {
			return fmt.Errorf("Failed to build menu eval script: %w", err)
		}
		if err = cdp.RunScriptInCtx(menuCtx, menuEvalScript); err != nil {
			return fmt.Errorf("Error injecting menu script: %w", err)
		}
	}

	rpcServer := rpc.HandleRpc()

	http.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets"))))
	http.Handle("/rpc", handlers.CORS(
		handlers.AllowedHeaders([]string{"Content-Type"}),
		handlers.AllowedMethods([]string{"POST"}),
		handlers.AllowedOrigins([]string{"https://steamloopback.host"}),
	)(rpcServer))

	fmt.Println("Listening on :" + *serverPort)
	log.Fatal(http.ListenAndServe(":"+*serverPort, nil))

	return nil
}
