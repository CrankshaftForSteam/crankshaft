package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"regexp"
	"strings"
	"text/template"

	"github.com/chromedp/cdproto/target"
	"github.com/chromedp/chromedp"
	"github.com/evanw/esbuild/pkg/cli"
	"github.com/gorilla/websocket"
)

const VERSION = "0.1.0"

func main() {
	if err := run(); err != nil {
		log.Fatalf("Error: %v", err)
	}
}

func run() error {
	debugPort := flag.String("debug-port", "8080", "CEF debug port")
	httpPort := flag.String("ws-port", "8085", "Port to run websocket server on")
	flag.Parse()

	fmt.Println("Building injected code...")
	cli.Run([]string{
		"injected/src/injected.ts",
		"--bundle",
		"--outfile=.build/injected.js",
	})

	allocatorCtx, cancel := chromedp.NewRemoteAllocator(context.Background(), "http://localhost:"+*debugPort)
	defer cancel()

	ctx, cancel := chromedp.NewContext(allocatorCtx)
	defer cancel()

	targetLibraryRe := regexp.MustCompile(`^https:\/\/steamloopback\.host\/index.html`)

	targets, err := chromedp.Targets(ctx)
	if err != nil {
		return fmt.Errorf("Failed to get targets: %w", err)
	}

	var libraryTarget *target.Info
	for _, target := range targets {
		if match := targetLibraryRe.MatchString(target.URL); match {
			libraryTarget = target
			break
		}
	}
	fmt.Println("library target", libraryTarget.URL)

	targetCtx, cancel := chromedp.NewContext(ctx, chromedp.WithTargetID(libraryTarget.TargetID))
	// Don't cancel or it'll close the Steam window
	// defer cancel()

	injectedScriptBytes, err := ioutil.ReadFile(".build/injected.js")
	if err != nil {
		return fmt.Errorf("Failed to read injected script: %w", err)
	}
	injectedScript := strings.ReplaceAll(string(injectedScriptBytes), "`", "\\`")

	evalTmpl := template.Must(template.ParseFiles("injected/eval.template.js"))
	var evalScript bytes.Buffer
	if err := evalTmpl.Execute(&evalScript, struct {
		Version        string
		InjectedScript string
	}{
		Version:        VERSION,
		InjectedScript: injectedScript,
	}); err != nil {
		return fmt.Errorf("Failed to execute eval script template: %w", err)
	}

	fmt.Println("eval script:", evalScript.String())

	_ = ioutil.WriteFile(".build/evalScript.js", []byte(evalScript.String()), 0644)
	err = chromedp.Run(targetCtx,
		chromedp.Evaluate(evalScript.String(), nil),
	)
	if err != nil {
		return fmt.Errorf("Failed to inject eval script: %w", err)
	}

	http.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets"))))
	http.HandleFunc("/ws", ws)
	fmt.Println("Listening on :" + *httpPort)
	log.Fatal(http.ListenAndServe(":"+*httpPort, nil))

	return nil
}

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

func ws(w http.ResponseWriter, r *http.Request) {
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
