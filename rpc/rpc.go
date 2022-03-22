package rpc

import (
	"github.com/gorilla/rpc/v2"
	rpcJson "github.com/gorilla/rpc/v2/json"
)

func HandleRpc() *rpc.Server {
	server := rpc.NewServer()
	server.RegisterCodec(rpcJson.NewCodec(), "application/json")
	server.RegisterService(new(NetworkService), "")
	server.RegisterService(new(FSService), "")
	return server
}
