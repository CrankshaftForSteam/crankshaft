package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

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

	ctx, cancel := getSteamCtx(*debugPort)
	defer cancel()

	libraryCtx, libraryMode, err := getLibraryCtx(ctx)
	if err != nil {
		return fmt.Errorf("Error getting library context: %w", err)
	}

	menuCtx, err := getDeckMenuCtx(ctx)
	if err != nil {
		return fmt.Errorf("Error getting menu context: %w", err)
	}

	bundleScripts()

	libraryEvalScript, err := buildEvalScript(*serverPort, *libraryMode, ".build/library.js")
	if err != nil {
		return fmt.Errorf("Failed to build library eval script: %w", err)
	}
	if err = runScriptInCtx(libraryCtx, libraryEvalScript); err != nil {
		return fmt.Errorf("Error injecting library script: %w", err)
	}

	menuEvalScript, err := buildEvalScript(*serverPort, *libraryMode, ".build/menu.js")
	if err != nil {
		return fmt.Errorf("Failed to build menu eval script: %w", err)
	}
	if err = runScriptInCtx(menuCtx, menuEvalScript); err != nil {
		return fmt.Errorf("Error injecting menu script: %w", err)
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
