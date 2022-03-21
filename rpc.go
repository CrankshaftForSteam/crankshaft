package main

import (
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/gorilla/rpc/v2"
	rpcJson "github.com/gorilla/rpc/v2/json"
)

type FetchArgs struct {
	Url string `json:"url"`
}

type FetchReply struct {
	Status int    `json:"status"`
	Data   string `json:"data"`
}

type NetworkService struct{}

func (service *NetworkService) Fetch(r *http.Request, req *FetchArgs, res *FetchReply) error {
	getRes, err := http.Get(req.Url)
	if err != nil {
		fmt.Println("Error fetching", req.Url)
		return err
	}
	defer getRes.Body.Close()

	data, err := ioutil.ReadAll(getRes.Body)
	if err != nil {
		fmt.Println("Error reading response body", err)
		return err
	}

	res.Data = string(data)
	res.Status = getRes.StatusCode

	return nil
}

func handleRpc() *rpc.Server {
	server := rpc.NewServer()
	server.RegisterCodec(rpcJson.NewCodec(), "application/json")
	server.RegisterService(new(NetworkService), "")
	return server
}
