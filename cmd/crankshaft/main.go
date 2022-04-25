package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"sync"

	"git.sr.ht/~avery/crankshaft/build"
	"git.sr.ht/~avery/crankshaft/cdp"
	devmode "git.sr.ht/~avery/crankshaft/cmd/crankshaft/dev_mode"
	"git.sr.ht/~avery/crankshaft/config"
	"git.sr.ht/~avery/crankshaft/patcher"
	"git.sr.ht/~avery/crankshaft/plugins"
	"git.sr.ht/~avery/crankshaft/ps"
	"git.sr.ht/~avery/crankshaft/rpc"
	"git.sr.ht/~avery/crankshaft/ws"
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
	dataDir := flag.String("data-dir", path.Join(xdg.DataHome, "crankshaft"), "Crankshaft data directory")
	pluginsDir := flag.String("plugins-dir", path.Join(xdg.DataHome, "crankshaft", "plugins"), "Directory to load plugins from")
	flag.Parse()

	// Ensure data directory exists
	if err := os.MkdirAll(*dataDir, 0700); err != nil {
		return fmt.Errorf(`Error creating data directory "%s": %v`, *dataDir, err)
	}

	// Ensure plugins directory exists
	if err := os.MkdirAll(*pluginsDir, 0700); err != nil {
		return fmt.Errorf(`Error creating plugins directory "%s": %v`, *pluginsDir, err)
	}

	crksftConfig, err := config.NewCrksftConfig(*dataDir)
	if err != nil {
		return err
	}

	plugins, err := plugins.NewPlugins(crksftConfig, *pluginsDir)
	if err != nil {
		return err
	}

	// Patch and bundle in parallel
	var wg sync.WaitGroup

	if devmode.DevMode {
		wg.Add(1)
		go func() {
			defer wg.Done()
			build.BundleScripts()
		}()
	}

	// If Steam is already running we can patch it while bundling
	alreadyPatched := false
	if ps.IsSteamRunning() && !*skipPatching {
		wg.Add(1)
		alreadyPatched = true

		go func() {
			defer wg.Done()
			cdp.WaitForConnection(*debugPort)
			cdp.WaitForLibraryEl(*debugPort)
			patcher.Patch(*debugPort, *serverPort)
		}()
	}

	// Start RPC server in the background
	// This will keep running in the background, so we don't need to add it to the wait group
	go func() {
		hub := ws.NewHub()
		go hub.Run()
		http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
			ws.ServeWs(hub, w, r)
		})

		rpcServer := rpc.HandleRpc(*debugPort, *serverPort, plugins, devmode.DevMode, hub)

		http.Handle("/rpc", handlers.CORS(
			handlers.AllowedHeaders([]string{"Content-Type"}),
			handlers.AllowedMethods([]string{"POST"}),
			handlers.AllowedOrigins([]string{"https://steamloopback.host"}),
		)(rpcServer))

		log.Println("Listening on :" + *serverPort)
		log.Fatal(http.ListenAndServe(":"+*serverPort, nil))
	}()

	wg.Wait()

	// If Steam was already running and we patched it earlier, wait for Steam to stop first
	if alreadyPatched {
		ps.WaitForSteamProcessToStop()
	}

	// Repatch Steam as it starts and stops
	for {
		log.Println("Waiting for Steam to start...")
		ps.WaitForSteamProcess()

		cdp.WaitForConnection(*debugPort)
		cdp.WaitForLibraryEl(*debugPort)
		patcher.Patch(*debugPort, *serverPort)

		ps.WaitForSteamProcessToStop()
	}
}
