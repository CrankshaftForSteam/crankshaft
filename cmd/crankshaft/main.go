package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path"
	"sync"
	"time"

	"git.sr.ht/~avery/crankshaft/build"
	"git.sr.ht/~avery/crankshaft/cdp"
	devmode "git.sr.ht/~avery/crankshaft/cmd/crankshaft/dev_mode"
	"git.sr.ht/~avery/crankshaft/config"
	"git.sr.ht/~avery/crankshaft/patcher"
	"git.sr.ht/~avery/crankshaft/plugins"
	"git.sr.ht/~avery/crankshaft/ps"
	"git.sr.ht/~avery/crankshaft/rpc"
	"git.sr.ht/~avery/crankshaft/tray"
	"git.sr.ht/~avery/crankshaft/ws"
	"github.com/gorilla/handlers"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("Error: %v", err)
	}
}

func run() error {
	debugPort, serverPort, skipPatching, dataDir, pluginsDir, logsDir := config.ParseFlags()

	// Ensure data directory exists
	if err := os.MkdirAll(dataDir, 0700); err != nil {
		return fmt.Errorf(`Error creating data directory "%s": %v`, dataDir, err)
	}

	// Ensure plugins directory exists
	if err := os.MkdirAll(pluginsDir, 0700); err != nil {
		return fmt.Errorf(`Error creating plugins directory "%s": %v`, pluginsDir, err)
	}

	// Ensure logs directory exists
	if err := os.MkdirAll(logsDir, 0700); err != nil {
		return fmt.Errorf(`Error creating logs directory "%s": %v`, logsDir, err)
	}

	// Create log file
	logFileName := time.Now().Format("2006-01-02-03:04:05")
	logFile, err := os.OpenFile(path.Join(logsDir, logFileName), os.O_CREATE|os.O_WRONLY, 0755)
	if err != nil {
		return fmt.Errorf(`Error creating log file "%s": %v`, logFileName, err)
	}
	defer logFile.Close()

	// Setup logging to write to stdout and log file
	logWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(logWriter)

	crksftConfig, err := config.NewCrksftConfig(dataDir)
	if err != nil {
		return err
	}

	plugins, err := plugins.NewPlugins(crksftConfig, pluginsDir)
	if err != nil {
		return err
	}

	waitAndPatch := func() {
		cdp.WaitForConnection(debugPort)
		cdp.WaitForLibraryEl(debugPort)
		patcher.Patch(debugPort, serverPort)
	}

	if len(os.Getenv("DISPLAY")) != 0 {
		log.Println("Starting system tray icon...")
		reloadChannel := make(chan struct{})
		go tray.StartTray(reloadChannel)
		go func() {
			for {
				<-reloadChannel
				waitAndPatch()
			}
		}()
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
	if ps.IsSteamRunning() && !skipPatching {
		wg.Add(1)
		alreadyPatched = true

		go func() {
			defer wg.Done()
			waitAndPatch()
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

		rpcServer := rpc.HandleRpc(debugPort, serverPort, plugins, devmode.DevMode, hub)

		http.Handle("/rpc", handlers.CORS(
			handlers.AllowedHeaders([]string{"Content-Type"}),
			handlers.AllowedMethods([]string{"POST"}),
			handlers.AllowedOrigins([]string{"https://steamloopback.host"}),
		)(rpcServer))

		log.Println("Listening on :" + serverPort)
		log.Fatal(http.ListenAndServe(":"+serverPort, nil))
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

		waitAndPatch()

		ps.WaitForSteamProcessToStop()
	}
}
