package plugins

import (
	"fmt"

	"github.com/evanw/esbuild/pkg/api"
)

func buildPluginScript(script string, name string, jsx bool) (string, error) {
	loader := api.LoaderJS
	if jsx {
		loader = api.LoaderJSX
	}

	res := api.Transform(script, api.TransformOptions{
		JSXMode:     api.JSXModeTransform,
		JSXFactory:  "smmShared.h",
		JSXFragment: "DocumentFragment",
		Loader:      loader,
		Format:      api.FormatIIFE,
		GlobalName:  "smmPlugins['" + name + "']",
	})
	if len(res.Errors) > 0 {
		fmt.Println(res.Errors)
		return "", fmt.Errorf("Error transforming plugin script.")
	}

	return string(res.Code), nil
}
