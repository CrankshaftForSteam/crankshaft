package inject

import (
	"fmt"
	"log"
	"net/http"

	"git.sr.ht/~avery/crankshaft/cdp"
	"git.sr.ht/~avery/crankshaft/plugins"
)

type InjectPluginsArgs struct{}

type InjectPluginsReply struct{}

func (service *InjectService) InjectPlugins(r *http.Request, req *InjectPluginsArgs, res *InjectPluginsReply) error {
	log.Println("Injecting plugins...")

	steamClient, err := cdp.NewSteamClient(service.debugPort)
	if err != nil {
		log.Println(err)
		return err
	}
	defer steamClient.Cancel()

	for _, plugin := range service.plugins.PluginMap {
		if !plugin.Enabled {
			continue
		}

		if err := injectPlugin(steamClient, plugin); err != nil {
			log.Println(err)
			return err
		}
	}

	// Tell the client that plugins are loaded
	steamClient.RunScriptInLibrary("window.csPluginsLoaded()")
	steamClient.RunScriptInMenu("window.csPluginsLoaded()")
	steamClient.RunScriptInQuickAccess("window.csPluginsLoaded()")

	return nil
}

type InjectPluginArgs struct {
	PluginId string `json:"pluginId"`
}

type InjectPluginReply struct{}

func (service *InjectService) InjectPlugin(r *http.Request, req *InjectPluginArgs, res *InjectPluginReply) error {
	log.Println("Injecting plugin", req.PluginId)

	err := service.plugins.Reload()
	if err != nil {
		return fmt.Errorf("Error reloading plugins: %v", err)
	}

	plugin, ok := service.plugins.PluginMap[req.PluginId]
	if !ok {
		return fmt.Errorf("Plugin %s not found", req.PluginId)
	}

	steamClient, err := cdp.NewSteamClient(service.debugPort)
	if err != nil {
		return err
	}
	defer steamClient.Cancel()

	return injectPlugin(steamClient, plugin)
}

func injectPlugin(steamClient *cdp.SteamClient, plugin plugins.Plugin) error {
	entrypoints := plugin.Config.Entrypoints[steamClient.UiMode]

	if entrypoints.Library {
		if err := steamClient.RunScriptInLibrary(plugin.Script); err != nil {
			return fmt.Errorf(`Error injecting plugin "%s" into library: %v`, plugin.Config.Name, err)
		}
	}

	if entrypoints.Menu {
		if err := steamClient.RunScriptInMenu(plugin.Script); err != nil {
			return fmt.Errorf(`Error injecting plugin "%s" into menu: %v`, plugin.Config.Name, err)
		}
	}

	if entrypoints.QuickAccess {
		if err := steamClient.RunScriptInQuickAccess(plugin.Script); err != nil {
			return fmt.Errorf(`Error injecting plugin "%s" into quick access: %v`, plugin.Config.Name, err)
		}
	}

	return nil
}
