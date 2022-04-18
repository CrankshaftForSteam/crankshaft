package cdp

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/chromedp/cdproto/target"
	"github.com/chromedp/chromedp"
)

// SteamClient is a wrapper around CDP commands that allow you to run scripts
// in and retrieve information about the running Steam client.
type SteamClient struct {
	debugPort string

	steamCtx context.Context
	Cancel   func()

	UiMode UIMode
}

// NewSteamClient creates and initializes a new SteamClient.
func NewSteamClient(debugPort string) (*SteamClient, error) {
	steamCtx, cancel, _ := GetSteamCtx(debugPort)

	steamClient := SteamClient{
		debugPort: debugPort,

		steamCtx: steamCtx,
		Cancel:   cancel,
	}

	// Get UI mode
	out, _ := steamClient.runScriptInTargetWithOutput(LibraryTarget, "SteamClient.UI.GetUIMode()")
	uiModeNum, err := strconv.Atoi(out)
	if err != nil {
		return nil, err
	}
	switch uiModeNum {
	case 0:
		steamClient.UiMode = UIModeDesktop
	case 4:
		steamClient.UiMode = UIModeDeck
	}

	return &steamClient, nil
}

func (sc *SteamClient) getTargets() ([]*target.Info, error) {
	return chromedp.Targets(sc.steamCtx)
}

// SteamTarget indicates which of the Steam Client's CDP targets you want to
// use as the context for whatever command you're executing.
type SteamTarget string

const (
	LibraryTarget SteamTarget = "SP"
	MenuTarget                = "MainMenu"
)

// Maximum number of times to retry getting a target
// Useful if you just reloaded the page and are waiting for target to load
// Will sleep for 1 second between retries
const getTargetRetryMax = 10

func (sc *SteamClient) runScriptInTarget(steamTarget SteamTarget, script string) error {
	var ctx context.Context = nil
	retries := 0

	for ctx == nil && retries < 10 {
		if retries != 0 {
			time.Sleep(1 * time.Second)
		}

		targets, err := sc.getTargets()
		if err != nil {
			return err
		}

		for _, target := range targets {
			if target.Title == string(steamTarget) {
				ctx, _ = chromedp.NewContext(sc.steamCtx, chromedp.WithTargetID(target.TargetID))
				break
			}
		}
		retries++
	}

	if ctx == nil {
		return fmt.Errorf("Couldn't find context for target %s", steamTarget)
	}

	err := chromedp.Run(ctx, chromedp.Evaluate(script, nil, withAwaitPromise))
	if err != nil {
		return err
	}

	return nil
}

func (sc *SteamClient) RunScriptInLibrary(script string) error {
	return sc.runScriptInTarget(LibraryTarget, script)
}

func (sc *SteamClient) RunScriptInMenu(script string) error {
	if sc.UiMode != UIModeDeck {
		return fmt.Errorf("Running in desktop mode, unable to inject script into Deck menu")
	}

	return sc.runScriptInTarget(MenuTarget, script)
}

func (sc *SteamClient) runScriptInTargetWithOutput(steamTarget SteamTarget, script string) (string, error) {
	targets, err := sc.getTargets()
	if err != nil {
		return "", nil
	}

	var ctx context.Context
	for _, target := range targets {
		if target.Title == string(steamTarget) {
			ctx, _ = chromedp.NewContext(sc.steamCtx, chromedp.WithTargetID(target.TargetID))
			break
		}
	}

	var output []byte

	err = chromedp.Run(ctx,
		chromedp.Evaluate(
			script,
			&output,
			withAwaitPromise,
		),
	)
	if err != nil {
		return "", err
	}

	return string(output), nil
}
