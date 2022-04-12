package plugins

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"strings"

	"git.sr.ht/~avery/steam-mod-manager/cdp"
	"github.com/BurntSushi/toml"
	"github.com/evanw/esbuild/pkg/api"
)

type authorInfo struct {
	Name string `json:"name"`
	Link string `json:"link"`
}

type entrypoint struct {
	Library bool `json:"library"`
	Menu    bool `json:"menu"`
}

type pluginConfig struct {
	Name   string `json:"name"`
	Link   string `json:"link"`
	Source string `json:"source"`

	Author authorInfo `json:"author"`

	Entrypoints map[cdp.UIMode]entrypoint `json:"entrypoints"`
}

func (p *pluginConfig) validateConfig() error {
	if _, contains := p.Entrypoints["desktop"]; !contains {
		return errors.New("Config was missing entrypoints.desktop")
	}

	if _, contains := p.Entrypoints["deck"]; !contains {
		return errors.New("Config was missing entrypoints.deck")
	}

	return nil
}

type Plugin struct {
	Id      string       `json:"id"`
	Dir     string       `json:"dir"`
	Config  pluginConfig `json:"config"`
	Script  string       `json:"script"`
	Enabled bool         `json:"enabled"`
}

func LoadPlugins(dataDir, pluginsDir string) ([]Plugin, error) {
	plugins := []Plugin{}

	// Get Crankshaft config to see which plugins are enabled
	crksftConfig, err := readConfig(dataDir)
	if err != nil {
		return nil, err
	}

	d, err := os.ReadDir(pluginsDir)
	if err != nil {
		return nil, fmt.Errorf(`Error reading plugins directory "%s": %v`, pluginsDir, err)
	}
	for _, entry := range d {
		if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		pluginName := entry.Name()
		pluginDir := path.Join(pluginsDir, pluginName)

		data, err := os.ReadFile(path.Join(pluginDir, "plugin.toml"))
		if err != nil {
			return nil, err
		}

		var config pluginConfig
		if _, err := toml.Decode(string(data), &config); err != nil {
			return nil, err
		}

		if err := config.validateConfig(); err != nil {
			return nil, fmt.Errorf(`Error found in config for plugin "%s": %v`, pluginName, err)
		}

		jsx := false
		data, err = os.ReadFile(path.Join(pluginDir, "dist", "index.js"))
		if err != nil && errors.Is(err, fs.ErrNotExist) {
			data, err = os.ReadFile(path.Join(pluginDir, "dist", "index.jsx"))
			jsx = true
			if err != nil {
				return nil, err
			}
		} else if err != nil {
			return nil, err
		}

		fmt.Printf("Building plugin script \"%s\"...\n", pluginName)
		script, err := BuildPluginScript(string(data), pluginName, jsx)
		if err != nil {
			fmt.Println(err)
			return nil, err
		}

		enabled := false
		if crksftPluginConfig, found := crksftConfig.Plugins[pluginName]; found {
			enabled = crksftPluginConfig.Enabled
		}

		plugins = append(plugins, Plugin{
			Id:      entry.Name(),
			Dir:     pluginDir,
			Script:  script,
			Config:  config,
			Enabled: enabled,
		})
	}

	return plugins, nil
}

func BuildPluginScript(script string, name string, jsx bool) (string, error) {
	loader := api.LoaderJS
	if jsx {
		loader = api.LoaderJSX
	}

	res := api.Transform(script, api.TransformOptions{
		JSXMode:     api.JSXModeTransform,
		JSXFactory:  "smmShared.h",
		JSXFragment: "DocumentFragment",
		Loader:      loader,
		Format:      api.FormatIIFE,
		GlobalName:  "smmPlugins['" + name + "']",
	})
	if len(res.Errors) > 0 {
		fmt.Println(res.Errors)
		return "", fmt.Errorf("Error transforming plugin script.")
	}

	return string(res.Code), nil
}
