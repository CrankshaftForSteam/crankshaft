package main

import (
	"context"
	"fmt"
	"regexp"

	"github.com/chromedp/cdproto/target"
	"github.com/chromedp/chromedp"
)

func getSteamCtx(debugPort string) (context.Context, func()) {
	allocatorCtx, cancel1 := chromedp.NewRemoteAllocator(context.Background(), "http://localhost:"+debugPort)

	ctx, cancel2 := chromedp.NewContext(allocatorCtx)

	return ctx, func() {
		cancel1()
		cancel2()
	}
}

func getLibraryCtx(ctx context.Context) (context.Context, error) {
	targetLibraryRe := regexp.MustCompile(`^https:\/\/steamloopback\.host\/index.html`)

	targets, err := chromedp.Targets(ctx)
	if err != nil {
		return nil, fmt.Errorf("Failed to get targets: %w", err)
	}

	var libraryTarget *target.Info
	for _, target := range targets {
		if match := targetLibraryRe.MatchString(target.URL); match {
			libraryTarget = target
			break
		}
	}
	fmt.Println("library target", libraryTarget.URL)

	targetCtx, _ := chromedp.NewContext(ctx, chromedp.WithTargetID(libraryTarget.TargetID))
	// Don't cancel or it'll close the Steam window

	return targetCtx, nil
}

func runScriptInCtx(ctx context.Context, script string) error {
	err := chromedp.Run(ctx,
		chromedp.Evaluate(script, nil),
	)
	if err != nil {
		return fmt.Errorf("Failed to inject eval script: %w", err)
	}

	return nil
}
