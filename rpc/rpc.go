package rpc

import (
	"git.sr.ht/~avery/steam-mod-manager/rpc/network"
	"github.com/gorilla/rpc/v2"
	rpcJson "github.com/gorilla/rpc/v2/json"
)

func HandleRpc() *rpc.Server {
	server := rpc.NewServer()
	server.RegisterCodec(rpcJson.NewCodec(), "application/json")
	server.RegisterService(new(network.NetworkService), "")
	server.RegisterService(new(FSService), "")
	return server
}
