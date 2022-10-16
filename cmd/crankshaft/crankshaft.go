package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"path"
	"sync"
	"syscall"

	"git.sr.ht/~avery/crankshaft/auth"
	"git.sr.ht/~avery/crankshaft/build"
	"git.sr.ht/~avery/crankshaft/cdp"
	"git.sr.ht/~avery/crankshaft/config"
	"git.sr.ht/~avery/crankshaft/patcher"
	"git.sr.ht/~avery/crankshaft/plugins"
	"git.sr.ht/~avery/crankshaft/ps"
	"git.sr.ht/~avery/crankshaft/rpc"
	"git.sr.ht/~avery/crankshaft/tags"
	"git.sr.ht/~avery/crankshaft/tray"
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

	if err := ensureDirsExist(noCache, dataDir, pluginsDir, logsDir, cacheDir, steamPath); err != nil {
		return fmt.Errorf("Error ensuring directories exist: %v", err)
	}

	logFile, err := setupLogging(logsDir)
	if err != nil {
		return fmt.Errorf("Error setting up logging: %v", err)
	}
	defer logFile.Close()

	crksftConfig, found, err := config.NewCrksftConfig(dataDir)
	if err != nil {
		return err
	}

	if !tags.Dev && (!found || !crksftConfig.InstalledAutostart) {
		if err := firstLaunchEnableAutostart(dataDir, crksftConfig); err != nil {
			return fmt.Errorf("Error installing autostart service on first launch: %v", err)
		}
	}

	// Make sure CEF debugging is enabled
	_, err = os.OpenFile(path.Join(steamPath, ".cef-enable-remote-debugging"), os.O_CREATE, 0644)
	if err != nil {
		log.Printf("Error enabling CEF debugging %v\n", err)
	}

	plugins, err := plugins.NewPlugins(crksftConfig, pluginsDir)
	if err != nil {
		return err
	}

	authToken, err := auth.GenAuthToken()
	if err != nil {
		return err
	}

	waitAndPatch := func() error {
		cdp.WaitForConnection(debugPort)
		cdp.WaitForLibraryEl(debugPort)
		cdp.WaitForVideoFinish(debugPort)
		cdp.ShowLoadingIndicator(debugPort, serverPort, authToken)
		err = patcher.Patch(debugPort, serverPort, steamPath, cacheDir, noCache, authToken)
		if err != nil {
			return err
		}
		return nil
	}

	tray.StartTray(waitAndPatch, logsDir)

	// Patch and bundle in parallel
	var wg sync.WaitGroup

	if tags.Dev {
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
		rpc.StartRpcServer(debugPort, serverPort, steamPath, dataDir, pluginsDir, authToken, plugins)
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
