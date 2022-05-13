package config

import (
	"errors"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path"

	"github.com/BurntSushi/toml"
)

type CrksftConfigPlugin struct {
	Enabled bool `toml:"enabled"`
}

type CrksftConfig struct {
	filePath           string
	InstalledAutostart bool
	Plugins            map[string]CrksftConfigPlugin `toml:"plugins"`
}

func NewCrksftConfig(dataDir string) (*CrksftConfig, bool, error) {
	config := CrksftConfig{
		filePath: path.Join(
			dataDir, "config.toml",
		),
		InstalledAutostart: false,
		Plugins:            make(map[string]CrksftConfigPlugin),
	}

	data, err := os.ReadFile(config.filePath)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			// Return empty config, the file will be created once there's something to save
			return &config, false, nil
		} else {
			return &config, false, err
		}
	}

	if _, err := toml.Decode(string(data), &config); err != nil {
		return &config, true, fmt.Errorf("Error decoding Crankshaft config: %v", err)
	}

	return &config, true, nil
}

func (c *CrksftConfig) Write() error {
	file, err := os.OpenFile(c.filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		log.Println(err)
		return err
	}
	defer file.Close()

	encoder := toml.NewEncoder(file)
	if err := encoder.Encode(c); err != nil {
		return fmt.Errorf("Error encoding Crankshaft config: %v", err)
	}

	return nil
}

func (c *CrksftConfig) UpdatePlugin(pluginId string, newConfig CrksftConfigPlugin) error {
	plugin, ok := c.Plugins[pluginId]
	if !ok {
		// Create a default plugin config
		plugin = CrksftConfigPlugin{}
	}
	plugin.Enabled = newConfig.Enabled
	c.Plugins[pluginId] = plugin

	if err := c.Write(); err != nil {
		return fmt.Errorf("Error writing updated Crankshaft config: %v", err)
	}

	return nil
}
