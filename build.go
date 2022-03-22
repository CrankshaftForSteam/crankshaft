package main

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"text/template"

	"github.com/evanw/esbuild/pkg/cli"
)

func bundleScripts() {
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
		"--jsx-factory=h",
		"--jsx-fragment=DocumentFragment",
		"--inject:./injected/dom-chef-shim.js",
		`--define:process={"env":{"NODE_ENV":"development"}}`,
		"--outdir=.build/",
	})
}

// buildEvalScript builds a script to be evaluated in the Steam target context.
func buildEvalScript(serverPort string, libraryMode LibraryMode, script string) (string, error) {
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
		LibraryMode    LibraryMode
	}{
		Version:        VERSION,
		InjectedScript: injectedScript,
		ServerPort:     serverPort,
		LibraryMode:    libraryMode,
	}); err != nil {
		return "", fmt.Errorf("Failed to execute eval script template: %w", err)
	}

	_ = ioutil.WriteFile(".build/evalScript.js", []byte(evalScript.String()), 0644)

	return evalScript.String(), nil
}
