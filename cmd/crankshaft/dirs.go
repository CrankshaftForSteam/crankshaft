package main

import (
	"fmt"
	"os"
)

// ensureDirsExist ensures that the given data, plugins, logs, cache, and
// Steam directories exist by creating them and returning if an error occurs.
func ensureDirsExist(noCache bool, dataDir, pluginsDir, logsDir, cacheDir, steamPath string) error {
	if err := os.MkdirAll(dataDir, 0700); err != nil {
		return fmt.Errorf(`Error creating data directory "%s": %v`, dataDir, err)
	}

	if err := os.MkdirAll(pluginsDir, 0700); err != nil {
		return fmt.Errorf(`Error creating plugins directory "%s": %v`, pluginsDir, err)
	}

	if err := os.MkdirAll(logsDir, 0700); err != nil {
		return fmt.Errorf(`Error creating logs directory "%s": %v`, logsDir, err)
	}

	if !noCache {
		if err := os.MkdirAll(cacheDir, 0700); err != nil {
			return fmt.Errorf(`Error creating cache directory "%s": %v`, cacheDir, err)
		}
	}

	if _, err := os.Stat(steamPath); err != nil {
		return fmt.Errorf(`Error reading Steam directory at "%s": %v`, steamPath, err)
	}

	return nil
}
