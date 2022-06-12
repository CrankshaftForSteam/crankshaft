package cdp

import (
	"context"
	"log"
	"time"

	"github.com/chromedp/cdproto/runtime"
	"github.com/chromedp/chromedp"
)

// UIMode indicates if Steam is running in desktop or deck mode.
type UIMode string

const (
	UIModeDesktop UIMode = "desktop"
	UIModeDeck           = "deck"
)

// GetSteamCtx returns the CDP context for the running Steam client.
func GetSteamCtx(debugPort string) (ctx context.Context, cancel func(), err error) {
	allocatorCtx, cancel1 := chromedp.NewRemoteAllocator(context.Background(), "http://localhost:"+debugPort)

	ctx, cancel2 := chromedp.NewContext(allocatorCtx)

	return ctx, func() {
		cancel1()
		cancel2()
	}, nil
}

func WaitForConnection(debugPort string) {
	steamCtx, cancel, _ := GetSteamCtx(debugPort)

	log.Println("Waiting to connect to Steam client...")

	connected := false
	for !connected {
		cancel()
		steamCtx, cancel, _ = GetSteamCtx(debugPort)

		targets, err := chromedp.Targets(steamCtx)
		if err != nil {
			log.Println("Error getting targets", err)
			time.Sleep(1 * time.Second)
			continue
		}
		log.Println("TARGETS: ", targets)

		foundSp := false
		for _, target := range targets {
			log.Println("check target", target.Title)
			if IsLibraryTarget(target) {
				foundSp = true
			}
		}
		if foundSp {
			connected = true
		}

		time.Sleep(1 * time.Second)
	}

	log.Println("Connected!")
}

func withAwaitPromise(p *runtime.EvaluateParams) *runtime.EvaluateParams {
	return p.WithAwaitPromise(true)
}
