package plugins

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"

	"github.com/BurntSushi/toml"
)

type CrksftConfig struct {
	Plugins map[string]struct {
		Enabled bool
	}
}

func NewCrksftConfig(dataDir string) (*CrksftConfig, error) {
	var config CrksftConfig

	data, err := os.ReadFile(path.Join(
		dataDir, "config.toml",
	))
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			// Return empty config, the file will be created once there's something to save
			return &config, nil
		} else {
			return &config, err
		}
	}

	if _, err := toml.Decode(string(data), &config); err != nil {
		return &config, fmt.Errorf("Error decoding Crankshaft config: %v", err)
	}

	return &config, nil
}
