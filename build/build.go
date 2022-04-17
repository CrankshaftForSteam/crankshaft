package build

import (
	"bytes"
	"errors"
	"fmt"
	"io/ioutil"
	"strings"
	"text/template"

	"git.sr.ht/~avery/steam-mod-manager/cdp"
	"github.com/evanw/esbuild/pkg/api"
)

const VERSION = "0.1.0"

func BundleScripts() error {
	fmt.Println("Bundling scripts to inject...")

	// TODO: get sourcemaps working
	// I tried inline sourcemaps, and aside from being massive, they were broken
	// and linked everything to the same line. Tried external maps served from
	// the static server, it seems like Chrome was refusing to load them and
	// throwing an error.
	// (not a huge deal since the bundle is small and isn't minified or anything)

	// This plugin allows using dom-chef instead of Preact in the given TSX file
	// by adding a comment that says `// @use-dom-chef` at the top of the file
	domChefPlugin := api.Plugin{
		Name: "dom-chef",
		Setup: func(build api.PluginBuild) {
			build.OnLoad(api.OnLoadOptions{Filter: `\.tsx$`}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				data, err := ioutil.ReadFile(args.Path)
				if err != nil {
					return api.OnLoadResult{}, err
				}

				contents := strings.Replace(string(data), "// @use-dom-chef", "import { h } from 'dom-chef';", 1)

				return api.OnLoadResult{
					Contents: &contents,
					Loader:   api.LoaderTSX,
				}, nil
			})
		},
	}

	res := api.Build(api.BuildOptions{
		EntryPoints: []string{
			"injected/src/entrypoints/library.ts",
			"injected/src/entrypoints/menu.ts",
		},
		Bundle:      true,
		Format:      api.FormatIIFE,
		JSXFactory:  "h",
		JSXFragment: "DocumentFragment",
		Inject:      []string{"injected/preact-shim.js"},
		Loader: map[string]api.Loader{
			".svg": api.LoaderDataURL,
		},
		Define: map[string]string{
			"process": `{"env":{"NODE_ENV":"development"}}`,
		},
		Plugins: []api.Plugin{domChefPlugin},
		Outdir:  ".build",
		Write:   true,
	})

	if len(res.Errors) > 0 {
		fmt.Println("Injected script bundling errors:")
		for i, err := range res.Errors {
			fmt.Printf("%d : %s %d:%d\n", i+1, err.Location.File, err.Location.Line, err.Location.Column)
			fmt.Println("    " + err.Text)
		}
		return errors.New("Error bundling injected scripts, see above")
	}

	if len(res.Warnings) > 0 {
		fmt.Println("Injected script bundling warnings:")
		for i, err := range res.Warnings {
			fmt.Println(i, ":", err)
		}
	}

	return nil
}

func BundleSharedScripts() (string, error) {
	res := api.Build(api.BuildOptions{
		EntryPoints: []string{
			"injected/src/entrypoints/shared.ts",
		},
		Bundle:     true,
		Format:     api.FormatIIFE,
		GlobalName: "smmShared",
		Outdir:     ".build",
		Write:      true,
	})

	// TODO: refactor to share this stuff with BundleScripts
	if len(res.Errors) > 0 {
		fmt.Println("Injected script bundling errors:")
		for i, err := range res.Errors {
			fmt.Println(i, ":", err)
		}
		return "", errors.New("Error bundling injected scripts, see above")
	}

	if len(res.Warnings) > 0 {
		fmt.Println("Injected script bundling warnings:")
		for i, err := range res.Warnings {
			fmt.Println(i, ":", err)
		}
	}

	script, err := ioutil.ReadFile(res.OutputFiles[0].Path)
	if err != nil {
		return "", fmt.Errorf("Failed to read shared scripts output: %v", err)
	}

	return string(script), nil
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
