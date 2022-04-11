package rpc

import (
	"net/http"

	"git.sr.ht/~avery/steam-mod-manager/plugins"
)

type PluginsService struct {
	plugins []plugins.Plugin
}

func NewPluginsService(plugins []plugins.Plugin) *PluginsService {
	return &PluginsService{plugins}
}

type ListArgs struct{}

type ListReply struct {
	Plugins []plugins.Plugin `json:"plugins"`
}

func (service *PluginsService) List(r *http.Request, req *ListArgs, res *ListReply) error {
	res.Plugins = service.plugins
	return nil
}
