// Package patcher handles patching of Steam client resources.
package patcher

import (
	"fmt"
	"os"
	"path"
)

// Patch patches necessary Steam resources.
func Patch(debugPort string, serverPort string, steamPath string, cacheDir string, noCache bool, authToken string) error {
	// Ensure cached patched scripts directory exists
	if !noCache {
		if err := os.MkdirAll(path.Join(cacheDir, "patched"), 0700); err != nil {
			return fmt.Errorf(`Error creating cached patched scripts directory "%s": %v`, cacheDir, err)
		}
	}

	return patchJS(path.Join(steamPath, "steamui"), debugPort, serverPort, cacheDir, noCache, authToken)
}

// Cleanup cleans up patched Steam resources.
func Cleanup(steamPath string) error {
	return cleanupJS(path.Join(steamPath, "steamui"))
}
