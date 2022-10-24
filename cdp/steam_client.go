package cdp

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
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
	out, _ := steamClient.runScriptInTargetWithOutput(IsLibraryTarget, "SteamClient.UI.GetUIMode()")
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
	MainTarget          SteamTarget = "Steam"
	LibraryTarget       SteamTarget = "SP"
	KeyboardTarget      SteamTarget = "SP_Keyboard"
	MenuTarget          SteamTarget = "MainMenu"
	QuickAccessTarget   SteamTarget = "QuickAccess"
	AppPropertiesTarget SteamTarget = "AppProperties"
)

type targetFilterFunc func(target *target.Info) bool

func IsMainTarget(target *target.Info) bool {
	return target.Title == string(MainTarget)
}

func IsLibraryTarget(target *target.Info) bool {
	return (target.Title == "SP" || strings.HasPrefix(target.URL, "https://steamloopback.host/index.html")) &&
		!strings.Contains(target.URL, "IN_STANDALONE_KEYBOARD")
}

func IsKeyboardTarget(target *target.Info) bool {
	return (target.Title == "SP" || strings.HasPrefix(target.URL, "https://steamloopback.host/index.html")) &&
		strings.Contains(target.URL, "IN_STANDALONE_KEYBOARD")
}

func IsMenuTarget(target *target.Info) bool {
	return target.Title == string(MenuTarget)
}

func IsQuickAccessTarget(target *target.Info) bool {
	return target.Title == string(QuickAccessTarget)
}

func IsAppPropertiesTarget(target *target.Info) bool {
	return strings.HasPrefix(target.Title, "Properties - ")
}

// WaitForTarget waits for the given target to be found.
func (sc *SteamClient) WaitForTarget(steamTarget SteamTarget) error {
	log.Println("Waiting for target", steamTarget)

	var isTarget targetFilterFunc
	switch steamTarget {
	case MainTarget:
		isTarget = IsMainTarget
	case LibraryTarget:
		isTarget = IsLibraryTarget
	case KeyboardTarget:
		isTarget = IsKeyboardTarget
	case MenuTarget:
		isTarget = IsMenuTarget
	case QuickAccessTarget:
		isTarget = IsQuickAccessTarget
	case AppPropertiesTarget:
		isTarget = IsAppPropertiesTarget
	}

	for {
		targets, err := sc.getTargets()
		if err != nil {
			return err
		}

		for _, target := range targets {
			if isTarget(target) {
				log.Println("Found target", steamTarget)
				return nil
			}
		}

		time.Sleep(1 * time.Second)
	}
}

// Maximum number of times to retry getting a target
// Useful if you just reloaded the page and are waiting for target to load
// Will sleep for 1 second between retries
const getTargetRetryMax = 10

func (sc *SteamClient) runScriptInTarget(isTarget targetFilterFunc, script string) error {
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
			if isTarget(target) {
				ctx, _ = chromedp.NewContext(sc.steamCtx, chromedp.WithTargetID(target.TargetID))
				break
			}
		}
		retries++
	}

	if ctx == nil {
		return fmt.Errorf("Couldn't find context for target")
	}

	err := chromedp.Run(ctx, chromedp.Evaluate(script, nil, withAwaitPromise))
	if err != nil {
		return err
	}

	return nil
}

func (sc *SteamClient) RunScriptInMain(script string) error {
	return sc.runScriptInTarget(IsMainTarget, script)
}

func (sc *SteamClient) RunScriptInLibrary(script string) error {
	return sc.runScriptInTarget(IsLibraryTarget, script)
}

func (sc *SteamClient) RunScriptInKeyboard(script string) error {
	if sc.UiMode != UIModeDesktop {
		return fmt.Errorf("Scripts can only be run in keyboard context in desktop mode")
	}

	return sc.runScriptInTarget(IsKeyboardTarget, script)
}

func (sc *SteamClient) RunScriptInMenu(script string) error {
	if sc.UiMode != UIModeDeck {
		return fmt.Errorf("Running in desktop mode, unable to inject script into Deck menu")
	}

	return sc.runScriptInTarget(IsMenuTarget, script)
}

func (sc *SteamClient) RunScriptInQuickAccess(script string) error {
	if sc.UiMode != UIModeDeck {
		return fmt.Errorf("Running in desktop mode, unable to inject script into Deck quick access menu")
	}

	return sc.runScriptInTarget(IsQuickAccessTarget, script)
}

func (sc *SteamClient) RunScriptInAppProperties(script string, title string) error {
	if sc.UiMode != UIModeDesktop {
		return fmt.Errorf("Scripts can only be run in app properties context in desktop mode")
	}

	return sc.runScriptInTarget(func(target *target.Info) bool {
		return target.Title == title
	}, script)
}

func (sc *SteamClient) runScriptInTargetWithOutput(isTarget targetFilterFunc, script string) (string, error) {
	targets, err := sc.getTargets()
	if err != nil {
		return "", nil
	}

	var ctx context.Context
	for _, target := range targets {
		if isTarget(target) {
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
