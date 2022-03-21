package main

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"strings"
	"text/template"
)

// buildEvalScript builds the script that will be evaluated in the Steam target context.
func buildEvalScript(serverPort string) (string, error) {
	injectedScriptBytes, err := ioutil.ReadFile(".build/injected.js")
	if err != nil {
		return "", fmt.Errorf("Failed to read injected script: %w", err)
	}
	injectedScript := strings.ReplaceAll(string(injectedScriptBytes), "`", "\\`")

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
