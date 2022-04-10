package plugins

import (
	"errors"
	"io/fs"
	"os"
	"path"

	"github.com/BurntSushi/toml"
)

type plugin struct {
	Enabled bool
}

type crksftConfig struct {
	Plugins map[string]plugin
}

func readConfig(dataDir string) (crksftConfig, error) {
	var config crksftConfig

	data, err := os.ReadFile(path.Join(
		dataDir, "config.toml",
	))
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			// Return empty config, the file will be created once there's something to save
			return config, nil
		} else {
			return config, err
		}
	}

	if _, err := toml.Decode(string(data), &config); err != nil {
		return config, err
	}

	return config, nil
}
