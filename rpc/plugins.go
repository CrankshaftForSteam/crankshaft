package rpc

import (
	"net/http"

	"git.sr.ht/~avery/steam-mod-manager/plugins"
)

type PluginsService struct {
	plugins *plugins.Plugins
}

func NewPluginsService(plugins *plugins.Plugins) *PluginsService {
	return &PluginsService{plugins}
}

type ListArgs struct{}

type ListReply struct {
	Plugins plugins.PluginMap `json:"plugins"`
}

func (service *PluginsService) List(r *http.Request, req *ListArgs, res *ListReply) error {
	res.Plugins = service.plugins.PluginMap
	for id, plugin := range res.Plugins {
		p := plugin
		// Remove script (it's large and not needed here since we're not loading
		// the plugin, just getting info about it)
		p.Script = ""
		res.Plugins[id] = p
	}
	return nil
}

type SetEnabledArgs struct {
	Id      string `json:"id"`
	Enabled bool   `json:"enabled"`
}

type SetEnabledReply struct{}

func (service *PluginsService) SetEnabled(r *http.Request, req *SetEnabledArgs, res *SetEnabledReply) error {
	err := service.plugins.SetEnabled(req.Id, req.Enabled)
	return err
}
