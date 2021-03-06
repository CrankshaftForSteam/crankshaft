package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path"
	"sync"
	"syscall"
	"time"

	"git.sr.ht/~avery/crankshaft/autostart"
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
	debugPort, serverPort, skipPatching, dataDir, pluginsDir, logsDir, cacheDir, steamPath, cleanup, noCache := config.ParseFlags()

	if cleanup {
		log.Println("Cleaning up patched files and exiting")
		err := patcher.Cleanup(steamPath)
		if err != nil {
			log.Println("Error cleaning up", err)
		}
		os.Exit(0)
	}

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

	// Ensure cache directory exists
	if !noCache {
		if err := os.MkdirAll(cacheDir, 0700); err != nil {
			return fmt.Errorf(`Error creating cache directory "%s": %v`, cacheDir, err)
		}
	}

	// Ensure Steam directory exists
	if _, err := os.Stat(steamPath); err != nil {
		return fmt.Errorf(`Error reading Steam directory at "%s": %v`, steamPath, err)
	}

	// Create log file
	logFileName := time.Now().Format("2006-01-02-15:04:05")
	logFile, err := os.OpenFile(path.Join(logsDir, logFileName), os.O_CREATE|os.O_WRONLY, 0755)
	if err != nil {
		return fmt.Errorf(`Error creating log file "%s": %v`, logFileName, err)
	}
	defer logFile.Close()

	// Setup logging to write to stdout and log file
	logWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(logWriter)

	crksftConfig, found, err := config.NewCrksftConfig(dataDir)
	if err != nil {
		return err
	}

	if config.Flatpak && (!found || !crksftConfig.InstalledAutostart) {
		// First launch, install autostart service
		if autostart.HostHasSystemd() {
			log.Println("Installing autostart service...")
			err = autostart.InstallService(dataDir)
			if err != nil {
				return fmt.Errorf("Error installing autostart service: %v", err)
			}

			crksftConfig.InstalledAutostart = true
			err = crksftConfig.Write()
			if err != nil {
				return fmt.Errorf("Error writing config: %v", err)
			}

			log.Println("Starting Crankshaft with Systemd and killing this instance, goodbye!")
			err = autostart.StartService()
			if err != nil {
				return fmt.Errorf("Error starting Crankshaft service: %v", err)
			}
			os.Exit(0)
		} else {
			log.Println("Not running systemd, skipping autostart service installation")
		}
	}

	plugins, err := plugins.NewPlugins(crksftConfig, pluginsDir)
	if err != nil {
		return err
	}

	waitAndPatch := func() error {
		cdp.WaitForConnection(debugPort)
		cdp.WaitForLibraryEl(debugPort)
		cdp.ShowLoadingIndicator(debugPort, serverPort)
		err = patcher.Patch(debugPort, serverPort, steamPath, cacheDir, noCache)
		if err != nil {
			return err
		}
		return nil
	}

	if len(os.Getenv("DISPLAY")) != 0 {
		log.Println("Starting system tray icon...")
		reloadChannel := make(chan struct{})
		go tray.StartTray(reloadChannel)
		go func() {
			for {
				<-reloadChannel
				if err := waitAndPatch(); err != nil {
					log.Println(err)
				}
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
			if err := waitAndPatch(); err != nil {
				log.Println(err)
			}
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

		rpcServer := rpc.HandleRpc(debugPort, serverPort, plugins, devmode.DevMode, hub, steamPath, dataDir, pluginsDir)

		http.Handle("/rpc", handlers.CORS(
			handlers.AllowedHeaders([]string{"Content-Type"}),
			handlers.AllowedMethods([]string{"POST"}),
			handlers.AllowedOrigins([]string{"https://steamloopback.host"}),
		)(rpcServer))

		log.Println("Listening on :" + serverPort)
		log.Fatal(http.ListenAndServe(":"+serverPort, nil))
	}()

	wg.Wait()

	// When Crankshaft exits, clean up patched JS
	exitSigs := make(chan os.Signal)
	signal.Notify(exitSigs, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		<-exitSigs
		log.Println("Cleaning up patched scripts before exiting")
		err := patcher.Cleanup(steamPath)
		if err != nil {
			log.Println("Error cleaning up", err)
		}
		os.Exit(0)
	}()

	// If Steam was already running and we patched it earlier, wait for Steam to stop first
	if alreadyPatched {
		ps.WaitForSteamProcessToStop()
		err := patcher.Cleanup(steamPath)
		if err != nil {
			log.Println("Error cleaning up", err)
		}
	}

	// Repatch Steam as it starts and stops
	for {
		log.Println("Waiting for Steam to start...")
		ps.WaitForSteamProcess()

		if err := waitAndPatch(); err != nil {
			return err
		}

		ps.WaitForSteamProcessToStop()

		log.Println("Steam stopped, cleaning up patched files...")
		err := patcher.Cleanup(steamPath)
		if err != nil {
			log.Println("Error cleaning up", err)
		}
	}
}
