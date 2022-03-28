package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"git.sr.ht/~avery/steam-mod-manager/cdp"
	"git.sr.ht/~avery/steam-mod-manager/patcher"
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
	skipPatching := flag.Bool("skip-patching", false, "Skip patching Steam client resources")
	flag.Parse()

	waitForSteamProcess()

	cdp.WaitForConnection(*debugPort)

	time.Sleep(3 * time.Second)

	// Patch and bundle in parallel
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		if *skipPatching {
			return
		}
		patcher.Patch(*debugPort)
	}()

	go func() {
		defer wg.Done()
		bundleScripts()
	}()

	wg.Wait()

	time.Sleep(3 * time.Second)

	steamClient, err := cdp.NewSteamClient(*debugPort)
	if err != nil {
		return err
	}
	defer steamClient.Cancel()

	fmt.Println("Client mode:", steamClient.UiMode)

	libraryEvalScript, err := buildEvalScript(*serverPort, steamClient.UiMode, ".build/library.js")
	if err != nil {
		return fmt.Errorf("Failed to build library eval script: %w", err)
	}
	if err := steamClient.RunScriptInLibrary(libraryEvalScript); err != nil {
		return fmt.Errorf("Error injecting library script: %w", err)
	}

	if steamClient.UiMode == cdp.UIModeDeck {
		menuEvalScript, err := buildEvalScript(*serverPort, steamClient.UiMode, ".build/menu.js")
		if err != nil {
			return fmt.Errorf("Failed to build menu eval script: %w", err)
		}
		if err := steamClient.RunScriptInMenu(menuEvalScript); err != nil {
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
