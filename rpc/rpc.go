package rpc

import (
	"log"
	"net/http"

	"git.sr.ht/~avery/crankshaft/auth"
	"git.sr.ht/~avery/crankshaft/plugins"
	"git.sr.ht/~avery/crankshaft/rpc/inject"
	"git.sr.ht/~avery/crankshaft/rpc/network"
	"git.sr.ht/~avery/crankshaft/ws"
	"github.com/gorilla/handlers"
	"github.com/gorilla/rpc/v2"
	rpcJson "github.com/gorilla/rpc/v2/json"
)

// StartRpcServer starts the HTTP server that serves the RPC plugin API.
func StartRpcServer(debugPort, serverPort, steamPath, dataDir, pluginsDir, authToken string, plugins *plugins.Plugins) {
	hub := ws.NewHub()
	go hub.Run()
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws.ServeWs(hub, w, r)
	})

	rpcServer := handleRpc(debugPort, serverPort, plugins, hub, steamPath, dataDir, pluginsDir, authToken)

	http.Handle("/rpc", auth.RequireAuth(authToken, handlers.CORS(
		handlers.AllowedHeaders([]string{"Content-Type", "X-Cs-Auth"}),
		handlers.AllowedMethods([]string{"POST"}),
		handlers.AllowedOrigins([]string{"https://steamloopback.host"}),
	)(rpcServer)))

	log.Println("Listening on :" + serverPort)
	log.Fatal(http.ListenAndServe(":"+serverPort, nil))
}

func handleRpc(debugPort, serverPort string, plugins *plugins.Plugins, hub *ws.Hub, steamPath, dataDir, pluginsDir, authToken string) *rpc.Server {
	server := rpc.NewServer()
	server.RegisterCodec(rpcJson.NewCodec(), "application/json")
	server.RegisterService(network.NewNetworkService(), "NetworkService")
	server.RegisterService(NewFSService(pluginsDir), "FSService")
	server.RegisterService(inject.NewInjectService(debugPort, serverPort, plugins, steamPath, authToken, pluginsDir), "InjectService")
	server.RegisterService(NewPluginsService(plugins), "PluginsService")
	server.RegisterService(NewIPCService(hub), "IPCService")
	server.RegisterService(NewAutostartService(dataDir), "AutostartService")
	server.RegisterService(NewExecService(), "ExecService")
	server.RegisterService(NewStoreService(dataDir), "StoreService")
	return server
}
