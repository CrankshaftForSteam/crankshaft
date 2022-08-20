package build

import (
	"bytes"
	_ "embed"
	"fmt"
	"io/ioutil"
	"log"
	"text/template"

	"git.sr.ht/~avery/crankshaft/cdp"
	"github.com/evanw/esbuild/pkg/api"
)

const VERSION = "0.2.3"

const Target = api.ES2020

// Steam is using Chrome 84
var Engines = []api.Engine{
	{
		Name:    api.EngineChrome,
		Version: "84",
	},
}

func BundleScripts() error {
	log.Println("Bundling scripts to inject...")

	// TODO: get sourcemaps working
	// I tried inline sourcemaps, and aside from being massive, they were broken
	// and linked everything to the same line. Tried external maps served from
	// the static server, it seems like Chrome was refusing to load them and
	// throwing an error.
	// (not a huge deal since the bundle is small and isn't minified or anything)

	res := api.Build(api.BuildOptions{
		EntryPoints: []string{
			"injected/src/entrypoints/library.ts",
			"injected/src/entrypoints/menu.ts",
			"injected/src/entrypoints/quick-access.ts",
			"injected/src/entrypoints/app-properties.ts",
		},
		Bundle:      true,
		Format:      api.FormatIIFE,
		Target:      Target,
		Engines:     Engines,
		JSXFactory:  "h",
		JSXFragment: "DocumentFragment",
		Inject:      []string{"injected/preact-shim.js"},
		Loader: map[string]api.Loader{
			".svg": api.LoaderDataURL,
			// CSS will be loaded directly from javascript
			".css": api.LoaderText,
		},
		Define: map[string]string{
			"process": `{"env":{"NODE_ENV":"development"}}`,
		},
		Plugins: []api.Plugin{DomChefPlugin()},
		Outdir:  ".build",
		Write:   true,
	})

	if err := checkErrors(res.Errors); err != nil {
		return err
	}

	checkWarnings(res.Warnings)

	return nil
}

func BundleSharedScripts() (string, error) {
	res := api.Build(api.BuildOptions{
		EntryPoints: []string{
			"injected/src/entrypoints/shared.ts",
		},
		Bundle:      true,
		Format:      api.FormatIIFE,
		Target:      Target,
		Engines:     Engines,
		JSXFactory:  "h",
		JSXFragment: "DocumentFragment",
		Inject:      []string{"injected/preact-shim.js"},
		GlobalName:  "smmShared",
		Outdir:      ".build",
		Write:       true,
	})

	if err := checkErrors(res.Errors); err != nil {
		return "", err
	}

	checkWarnings(res.Warnings)

	script, err := ioutil.ReadFile(res.OutputFiles[0].Path)
	if err != nil {
		return "", fmt.Errorf("Failed to read shared scripts output: %v", err)
	}

	return string(script), nil
}

//go:embed eval.template.js
var evalScriptTemplate string

// BuildEvalScriptFromFile gets a script from a file and builds an eval script with it.
func BuildEvalScriptFromFile(serverPort string, uiMode cdp.UIMode, scriptPath, steamPath, authToken, pluginsDir string) (string, error) {
	scriptBytes, err := ioutil.ReadFile(scriptPath)
	if err != nil {
		return "", fmt.Errorf(`Failed to read injected script at "%s": %w`, scriptPath, err)
	}

	script := string(scriptBytes)

	return BuildEvalScript(serverPort, uiMode, script, steamPath, authToken, pluginsDir)
}

// BuildEvalScript builds a script to be evaluated in the Steam target context.
func BuildEvalScript(serverPort string, uiMode cdp.UIMode, script, steamPath, authToken, pluginsDir string) (string, error) {
	evalTmpl := template.Must(template.New("eval").Parse(evalScriptTemplate))
	var evalScript bytes.Buffer
	if err := evalTmpl.Execute(&evalScript, struct {
		Version        string
		InjectedScript string
		ServerPort     string
		UIMode         cdp.UIMode
		SteamDir       string
		AuthToken      string
		PluginsDir     string
	}{
		Version:        VERSION,
		InjectedScript: script,
		ServerPort:     serverPort,
		UIMode:         uiMode,
		SteamDir:       steamPath,
		AuthToken:      authToken,
		PluginsDir:     pluginsDir,
	}); err != nil {
		return "", fmt.Errorf("Failed to execute eval script template: %w", err)
	}

	_ = ioutil.WriteFile(".build/evalScript.js", []byte(evalScript.String()), 0644)

	return evalScript.String(), nil
}
