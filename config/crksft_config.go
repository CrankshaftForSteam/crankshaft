package config

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"

	"github.com/BurntSushi/toml"
)

type CrksftConfigPlugin struct {
	Enabled bool
}

type CrksftConfig struct {
	filePath string
	Plugins  map[string]CrksftConfigPlugin `toml:"plugins"`
}

func NewCrksftConfig(dataDir string) (*CrksftConfig, error) {
	config := CrksftConfig{
		filePath: path.Join(
			dataDir, "config.toml",
		),
	}

	data, err := os.ReadFile(config.filePath)
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

func (c *CrksftConfig) Write() error {
	file, err := os.OpenFile(c.filePath, os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
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
		return fmt.Errorf(`Plugin "%s" not found in Crankshaft config`, pluginId)
	}
	plugin.Enabled = newConfig.Enabled
	c.Plugins[pluginId] = plugin

	if err := c.Write(); err != nil {
		return fmt.Errorf("Error writing updated Crankshaft config: %v", err)
	}

	return nil
}
