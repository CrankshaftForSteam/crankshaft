package build

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"text/template"

	"git.sr.ht/~avery/steam-mod-manager/cdp"
	"github.com/evanw/esbuild/pkg/cli"
)

const VERSION = "0.1.0"

func BundleScripts() {
	fmt.Println("Bundling scripts to inject...")

	// TODO: get sourcemaps working
	// I tried inline sourcemaps, and aside from being massive, they were broken
	// and linked everything to the same line. Tried external maps served from
	// the static server, it seems like Chrome was refusing to load them and
	// throwing an error.
	// (not a huge deal since the bundle is small and isn't minified or anything)

	cli.Run([]string{
		"injected/src/entrypoints/library.ts",
		"injected/src/entrypoints/menu.ts",
		"--bundle",
		"--format=iife",
		"--jsx-factory=h",
		"--jsx-fragment=DocumentFragment",
		"--inject:./injected/dom-chef-shim.js",
		"--loader:.svg=dataurl",
		`--define:process={"env":{"NODE_ENV":"development"}}`,
		"--outdir=.build/",
	})
}

// buildEvalScript builds a script to be evaluated in the Steam target context.
func BuildEvalScript(serverPort string, uiMode cdp.UIMode, script string) (string, error) {
	injectedScriptBytes, err := ioutil.ReadFile(script)
	if err != nil {
		return "", fmt.Errorf("Failed to read injected script: %w", err)
	}

	injectedScript := string(injectedScriptBytes)

	evalTmpl := template.Must(template.ParseFiles("injected/eval.template.js"))
	var evalScript bytes.Buffer
	if err := evalTmpl.Execute(&evalScript, struct {
		Version        string
		InjectedScript string
		ServerPort     string
		UIMode         cdp.UIMode
	}{
		Version:        VERSION,
		InjectedScript: injectedScript,
		ServerPort:     serverPort,
		UIMode:         uiMode,
	}); err != nil {
		return "", fmt.Errorf("Failed to execute eval script template: %w", err)
	}

	_ = ioutil.WriteFile(".build/evalScript.js", []byte(evalScript.String()), 0644)

	return evalScript.String(), nil
}