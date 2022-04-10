package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"sync"

	"git.sr.ht/~avery/steam-mod-manager/build"
	"git.sr.ht/~avery/steam-mod-manager/cdp"
	"git.sr.ht/~avery/steam-mod-manager/patcher"
	"git.sr.ht/~avery/steam-mod-manager/plugins"
	"git.sr.ht/~avery/steam-mod-manager/rpc"
	"github.com/adrg/xdg"
	"github.com/gorilla/handlers"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("Error: %v", err)
	}
}

func run() error {
	debugPort := flag.String("debug-port", "8080", "CEF debug port")
	serverPort := flag.String("server-port", "8085", "Port to run HTTP/websocket server on")
	skipPatching := flag.Bool("skip-patching", false, "Skip patching Steam client resources")
	pluginsDir := flag.String("plugins-dir", path.Join(xdg.DataHome, "crankshaft", "plugins"), "Directory to load plugins from")
	flag.Parse()

	// Ensure plugins directory exists
	if err := os.MkdirAll(*pluginsDir, 0700); err != nil {
		return fmt.Errorf(`Error creating plugins directory "%s": %v`, *pluginsDir, err)
	}

	// List all plugins
	plugins, err := plugins.LoadPlugins(*pluginsDir)
	if err != nil {
		return err
	}

	waitForSteamProcess()

	cdp.WaitForConnection(*debugPort)

	err = cdp.WaitForLibraryEl(*debugPort)
	if err != nil {
		return err
	}

	// Patch and bundle in parallel
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		if *skipPatching {
			return
		}
		patcher.Patch(*debugPort, *serverPort)
	}()

	go func() {
		defer wg.Done()
		build.BundleScripts()
	}()

	wg.Wait()

	rpcServer := rpc.HandleRpc(*debugPort, *serverPort, plugins)

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
