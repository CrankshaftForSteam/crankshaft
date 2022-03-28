package rpc

import (
	"git.sr.ht/~avery/steam-mod-manager/rpc/network"
	"github.com/gorilla/rpc/v2"
	rpcJson "github.com/gorilla/rpc/v2/json"
)

func HandleRpc(debugPort, serverPort string) *rpc.Server {
	server := rpc.NewServer()
	server.RegisterCodec(rpcJson.NewCodec(), "application/json")
	server.RegisterService(network.NewNetworkService(), "NetworkService")
	server.RegisterService(new(FSService), "")
	server.RegisterService(NewInjectService(debugPort, serverPort), "InjectService")
	return server
}
