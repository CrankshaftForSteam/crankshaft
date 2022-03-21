package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

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

	evalScript, err := buildEvalScript(*serverPort)
	if err != nil {
		return fmt.Errorf("Failed to build eval script: %w", err)
	}

	targetCtx, err := getLibraryCtx(ctx)
	if err != nil {
		return fmt.Errorf("Error getting library context: %w", err)
	}

	if err = runScriptInCtx(targetCtx, evalScript); err != nil {
		return fmt.Errorf("Error injecting script: %w", err)
	}

	rpcServer := handleRpc()

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
