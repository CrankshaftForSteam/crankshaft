package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "https://steamloopback.host"
	},
}

type SocketMessage struct {
	Id   string `json:"id"`
	Type string `json:"type"`
	Url  string `json:"url"`
}

func handleWs(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal("Upgrade error:", err)
		return
	}
	defer c.Close()

	for {
		socketMessage := SocketMessage{}
		err := c.ReadJSON(&socketMessage)
		if err != nil {
			log.Println("Read message error:", err)
			break
		}

		handleMessages(socketMessage, c)
	}
}

func handleMessages(msg SocketMessage, c *websocket.Conn) {
	switch msg.Type {
	case "connected":
		fmt.Println("message CONNECTED")

	case "fetch":
		res, err := http.Get(msg.Url)
		if err != nil {
			fmt.Println("Error fetching", msg.Url)
			return
		}
		defer res.Body.Close()

		resData, err := ioutil.ReadAll(res.Body)
		if err != nil {
			fmt.Println("Error reading response body", err)
			return
		}

		data := make(map[string]interface{})
		err = json.Unmarshal(resData, &data)
		if err != nil {
			fmt.Println("Error unmarshaling response data", err)
			return
		}

		data["id"] = msg.Id

		out, err := json.Marshal(data)
		if err != nil {
			fmt.Println("Error marshaling out data", err)
			return
		}

		fmt.Println(string(out))
		c.WriteMessage(websocket.TextMessage, out)
	}
}