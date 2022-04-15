package plugins

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"strings"

	"git.sr.ht/~avery/steam-mod-manager/config"
)

type Plugin struct {
	Id      string       `json:"id"`
	Dir     string       `json:"dir"`
	Config  pluginConfig `json:"config"`
	Script  string       `json:"script"`
	Enabled bool         `json:"enabled"`
}

type PluginMap = map[string]Plugin

type Plugins struct {
	PluginMap    PluginMap
	pluginsDir   string
	crksftConfig *config.CrksftConfig
}

func NewPlugins(crksftConfig *config.CrksftConfig, pluginsDir string) (*Plugins, error) {
	plugins := Plugins{
		PluginMap:    PluginMap{},
		pluginsDir:   pluginsDir,
		crksftConfig: crksftConfig,
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

		config, err := NewPluginConfig(pluginDir)
		if err != nil {
			return nil, err
		}

		jsx := false
		data, err := os.ReadFile(path.Join(pluginDir, "dist", "index.js"))
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
		script, err := buildPluginScript(string(data), pluginName, jsx)
		if err != nil {
			fmt.Println(err)
			return nil, err
		}

		enabled := false
		if crksftPluginConfig, found := crksftConfig.Plugins[pluginName]; found {
			enabled = crksftPluginConfig.Enabled
		}

		plugins.addPlugin(Plugin{
			Id:      entry.Name(),
			Dir:     pluginDir,
			Script:  script,
			Config:  *config,
			Enabled: enabled,
		})
	}

	return &plugins, nil
}

func (p *Plugins) addPlugin(plugin Plugin) {
	p.PluginMap[plugin.Id] = plugin
}

func (p *Plugins) SetEnabled(pluginId string, enabled bool) error {
	plugin, ok := p.PluginMap[pluginId]
	if !ok {
		return errors.New("Plugin not found: " + pluginId)
	}
	plugin.Enabled = enabled
	p.PluginMap[pluginId] = plugin

	p.crksftConfig.UpdatePlugin(pluginId, config.CrksftConfigPlugin{
		Enabled: plugin.Enabled,
	})

	return nil
}
