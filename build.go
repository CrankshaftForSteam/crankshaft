package main

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"text/template"

	"github.com/evanw/esbuild/pkg/cli"
)

// buildEvalScript builds the script that will be evaluated in the Steam target context.
func buildEvalScript(serverPort string) (string, error) {
	fmt.Println("Building injected code...")
	cli.Run([]string{
		"injected/src/injected.ts",
		"--bundle",
		"--jsx-factory=h",
		"--jsx-fragment=DocumentFragment",
		"--inject:./injected/dom-chef-shim.js",
		"--outfile=.build/injected.js",
	})

	injectedScriptBytes, err := ioutil.ReadFile(".build/injected.js")
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
	}{
		Version:        VERSION,
		InjectedScript: injectedScript,
		ServerPort:     serverPort,
	}); err != nil {
		return "", fmt.Errorf("Failed to execute eval script template: %w", err)
	}

	fmt.Println("eval script:", evalScript.String())

	_ = ioutil.WriteFile(".build/evalScript.js", []byte(evalScript.String()), 0644)

	return evalScript.String(), nil
}
