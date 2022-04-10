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
	Name string
	Link string
}

type entrypoint struct {
	Library bool
	Menu    bool
}

type pluginConfig struct {
	Name   string
	Link   string
	Source string

	Author authorInfo

	Entrypoints map[cdp.UIMode]entrypoint
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
	Dir    string
	Config pluginConfig
	Script string
}

func LoadPlugins(pluginsDir string) ([]Plugin, error) {
	plugins := []Plugin{}

	d, err := os.ReadDir(pluginsDir)
	if err != nil {
		return nil, fmt.Errorf(`Error reading plugins directory "%s": %v`, pluginsDir, err)
	}
	for _, entry := range d {
		if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		data, err := os.ReadFile(path.Join(pluginsDir, entry.Name(), "plugin.toml"))
		if err != nil {
			return nil, err
		}

		var config pluginConfig
		if _, err := toml.Decode(string(data), &config); err != nil {
			return nil, err
		}

		if err := config.validateConfig(); err != nil {
			return nil, fmt.Errorf(`Error found in config for plugin "%s": %v`, entry.Name(), err)
		}

		jsx := false
		data, err = os.ReadFile(path.Join(pluginsDir, entry.Name(), "dist", "index.js"))
		if err != nil && errors.Is(err, fs.ErrNotExist) {
			data, err = os.ReadFile(path.Join(pluginsDir, entry.Name(), "dist", "index.jsx"))
			jsx = true
			if err != nil {
				return nil, err
			}
		} else if err != nil {
			return nil, err
		}

		fmt.Printf("Building plugin script \"%s\"...\n", entry.Name())
		script, err := BuildPluginScript(string(data), entry.Name(), jsx)
		if err != nil {
			fmt.Println(err)
			return nil, err
		}

		plugins = append(plugins, Plugin{
			Dir:    path.Join(pluginsDir, entry.Name()),
			Script: script,
			Config: config,
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
