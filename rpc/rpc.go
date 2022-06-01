package rpc

import (
	"git.sr.ht/~avery/crankshaft/plugins"
	"git.sr.ht/~avery/crankshaft/rpc/inject"
	"git.sr.ht/~avery/crankshaft/rpc/network"
	"git.sr.ht/~avery/crankshaft/ws"
	"github.com/gorilla/rpc/v2"
	rpcJson "github.com/gorilla/rpc/v2/json"
)

func HandleRpc(debugPort, serverPort string, plugins *plugins.Plugins, devMode bool, hub *ws.Hub, steamPath string, dataDir string) *rpc.Server {
	server := rpc.NewServer()
	server.RegisterCodec(rpcJson.NewCodec(), "application/json")
	server.RegisterService(network.NewNetworkService(), "NetworkService")
	server.RegisterService(new(FSService), "")
	server.RegisterService(inject.NewInjectService(debugPort, serverPort, plugins, devMode, steamPath), "InjectService")
	server.RegisterService(NewPluginsService(plugins), "PluginsService")
	server.RegisterService(NewIPCService(hub), "IPCService")
	server.RegisterService(NewAutostartService(dataDir), "AutostartService")
	server.RegisterService(NewExecService(), "ExecService")
	return server
}
