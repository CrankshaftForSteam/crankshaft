package config

import (
	"log"

	"golang.org/x/sys/windows/registry"
)

func getDefaultSteamPath() (steamPath string) {
	key, err := registry.OpenKey(registry.LOCAL_MACHINE, `SOFTWARE\Valve\Steam`, registry.QUERY_VALUE|registry.WOW64_32KEY)
	if err != nil {
		log.Fatal(err)
		return
	}
	defer key.Close()

	steamPath, _, err = key.GetStringValue("InstallPath")
	if err != nil {
		log.Fatal(err)
		return
	}

	// It's unlikely for Windows to have a variable in this path, so just return it
	return steamPath
}
