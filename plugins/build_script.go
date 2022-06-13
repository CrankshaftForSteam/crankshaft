package plugins

import (
	"errors"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path"

	"github.com/evanw/esbuild/pkg/api"
)

func buildPluginScript(pluginName, pluginDir string) (string, error) {
	indexJsPath := path.Join(pluginDir, "dist", "index.js")
	data, err := os.ReadFile(indexJsPath)
	if err != nil && errors.Is(err, fs.ErrNotExist) {
		if errors.Is(err, fs.ErrNotExist) {
			return "", fmt.Errorf(`[Plugin %s]: index.js not found at "%s" - %v`, pluginName, indexJsPath, err)
		}
		return "", err
	}

	script := string(data)

	res := api.Transform(script, api.TransformOptions{
		Format:     api.FormatIIFE,
		GlobalName: "smmPlugins['" + pluginName + "']",
	})
	if len(res.Errors) > 0 {
		log.Println(res.Errors)
		return "", fmt.Errorf("Error transforming plugin script.")
	}

	return string(res.Code), nil
}
