package network

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

type GetArgs struct {
	Url string `json:"url"`
}

type GetReply struct {
	Status int    `json:"status"`
	Data   string `json:"data"`
}

func (service *NetworkService) Get(r *http.Request, req *GetArgs, res *GetReply) error {
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
