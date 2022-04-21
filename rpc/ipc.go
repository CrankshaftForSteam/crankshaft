package rpc

import (
	"net/http"

	"git.sr.ht/~avery/crankshaft/ws"
)

type IPCService struct {
	wsHub *ws.Hub
}

func NewIPCService(hub *ws.Hub) *IPCService {
	return &IPCService{hub}
}

type SendArgs struct {
	Message string `json:"message"`
}

type SendReply struct{}

func (service *IPCService) Send(r *http.Request, req *SendArgs, res *SendReply) error {
	service.wsHub.Broadcast <- []byte(req.Message)
	return nil
}
