package ws

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

// Dervived from gorilla/websocket chat example
// https://github.com/gorilla/websocket/tree/master/examples/chat

const writeWait = 5 * time.Second

type client struct {
	conn *websocket.Conn
	send chan []byte
}

func (c *client) writePump() {
	defer c.conn.Close()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		}
	}
}

type Hub struct {
	clients    map[*client]bool
	Broadcast  chan []byte
	register   chan *client
	unregister chan *client
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*client]bool),
		Broadcast:  make(chan []byte),
		register:   make(chan *client),
		unregister: make(chan *client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}

		case message := <-h.Broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &client{conn: conn, send: make(chan []byte, 256)}
	hub.register <- client

	go client.writePump()
}
