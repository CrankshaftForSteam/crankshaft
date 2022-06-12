package inject

import (
	"fmt"
	"log"
	"net/http"

	"git.sr.ht/~avery/crankshaft/cdp"
	"git.sr.ht/~avery/crankshaft/plugins"
)

type entry string

const (
	LibraryEntry       entry = "library"
	MenuEntry          entry = "menu"
	QuickAccessEntry   entry = "quickAccess"
	AppPropertiesEntry entry = "appProperties"
)

// To make the API nicer, the client will pass it's entrypoint, and we convert
// it to a target on the server.
func (e entry) target() cdp.SteamTarget {
	switch e {
	case LibraryEntry:
		return cdp.LibraryTarget
	case MenuEntry:
		return cdp.MenuTarget
	case QuickAccessEntry:
		return cdp.QuickAccessTarget
	case AppPropertiesEntry:
		return cdp.AppPropertiesTarget
	}

	// This should never be reached
	return cdp.LibraryTarget
}

type InjectPluginsArgs struct {
	Entrypoint entry `json:"entrypoint"`
}

type InjectPluginsReply struct{}

func (service *InjectService) InjectPlugins(r *http.Request, req *InjectPluginsArgs, res *InjectPluginsReply) error {
	log.Printf("Injecting plugins into %s...\n", req.Entrypoint)

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

		if err := injectPlugin(steamClient, plugin, req.Entrypoint.target()); err != nil {
			log.Println(err)
			return err
		}
	}

	// Tell the client that plugins are loaded
	switch req.Entrypoint {
	case LibraryEntry:
		steamClient.RunScriptInLibrary("window.csPluginsLoaded()")
	case MenuEntry:
		steamClient.RunScriptInMenu("window.csPluginsLoaded()")
	case QuickAccessEntry:
		steamClient.RunScriptInQuickAccess("window.csPluginsLoaded()")
	case AppPropertiesEntry:
		steamClient.RunScriptInAppProperties("window.csPluginsLoaded()")
	}

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

	for _, entrypoint := range []cdp.SteamTarget{cdp.LibraryTarget, cdp.MenuTarget, cdp.QuickAccessTarget} {
		if err := injectPlugin(steamClient, plugin, entrypoint); err != nil {
			return err
		}
	}

	return nil
}

func injectPlugin(steamClient *cdp.SteamClient, plugin plugins.Plugin, entrypoint cdp.SteamTarget) error {
	pluginEntrypoints := plugin.Config.Entrypoints[steamClient.UiMode]

	if entrypoint == cdp.LibraryTarget && pluginEntrypoints.Library {
		log.Println("Injecting", plugin.Id, "into library")
		if err := steamClient.RunScriptInLibrary(plugin.Script); err != nil {
			return fmt.Errorf(`Error injecting plugin "%s" into library: %v`, plugin.Config.Name, err)
		}
	}

	if entrypoint == cdp.MenuTarget && pluginEntrypoints.Menu {
		log.Println("Injecting", plugin.Id, "into menu")
		if err := steamClient.RunScriptInMenu(plugin.Script); err != nil {
			return fmt.Errorf(`Error injecting plugin "%s" into menu: %v`, plugin.Config.Name, err)
		}
	}

	if entrypoint == cdp.QuickAccessTarget && pluginEntrypoints.QuickAccess {
		log.Println("Injecting", plugin.Id, "into quick access")
		if err := steamClient.RunScriptInQuickAccess(plugin.Script); err != nil {
			log.Println(err)
			return fmt.Errorf(`Error injecting plugin "%s" into quick access: %v`, plugin.Config.Name, err)
		}
	}

	if entrypoint == cdp.AppPropertiesTarget && pluginEntrypoints.AppProperties {
		log.Println("Injecting", plugin.Id, "into app properties")
		if err := steamClient.RunScriptInAppProperties(plugin.Script); err != nil {
			log.Println(err)
			return fmt.Errorf(`Error injecting plugin "%s" into app properties: %v`, plugin.Config.Name, err)
		}
	}

	return nil
}
