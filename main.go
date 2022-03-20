package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"regexp"

	"github.com/chromedp/cdproto/target"
	"github.com/chromedp/chromedp"
)


func main() {
	debugPort := flag.String("debug-port", "8080", "CEF debug port")
	flag.Parse()

	allocatorCtx, cancel := chromedp.NewRemoteAllocator(context.Background(), "http://localhost:" + *debugPort)
	defer cancel()

	ctx, cancel := chromedp.NewContext(allocatorCtx)
	defer cancel()

	targetLibraryRe := regexp.MustCompile(`^https:\/\/steamloopback\.host\/index.html`)

	targets, err := chromedp.Targets(ctx)
	if err != nil {
		log.Fatalf("Failed to get targets: %v", err)
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
	// defer cancel()

	var text string
	err = chromedp.Run(targetCtx,
		chromedp.Text(".pageablecontainer_Name_2hfib", &text),
	)
	if err != nil {
		log.Fatalf("Failed to get body: %v", err)
	}
	fmt.Println("Text: ", text)
}