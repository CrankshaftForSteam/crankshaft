package rpc

import (
	"net/http"

	"git.sr.ht/~avery/crankshaft/plugins"
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
	res.Plugins = make(map[string]plugins.Plugin)
	for id, plugin := range service.plugins.PluginMap {
		// We don't include the script here. It's large and not necessary since
		// we're just getting info about the plugin, not loading it, so we don't
		// need to send it over.
		res.Plugins[id] = plugins.Plugin{
			Id:      plugin.Id,
			Dir:     plugin.Dir,
			Config:  plugin.Config,
			Enabled: plugin.Enabled,
		}
	}
	return nil
}

type RebuildArgs struct {
	Id string `json:"id"`
}

type RebuildReply struct{}

func (service *PluginsService) Rebuild(r *http.Request, req *RebuildArgs, res *RebuildReply) error {
	return service.plugins.RebuildPlugin(req.Id)
}

type ReloadArgs struct{}
type ReloadReply struct{}

func (service *PluginsService) Reload(r *http.Request, req *ReloadArgs, res *ReloadReply) error {
	return service.plugins.Reload()
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

type RemoveArgs struct {
	Id string `json:"id"`
}

type RemoveReply struct{}

func (service *PluginsService) Remove(r *http.Request, req *RemoveArgs, res *RemoveReply) error {
	return service.plugins.RemovePlugin(req.Id)
}
