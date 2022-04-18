package build

import (
	"io/ioutil"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

// This plugin allows using dom-chef instead of Preact in the given TSX file
// by adding a comment that says `// @use-dom-chef` at the top of the file.
// The dom-chef import will override the injected preact shim imports.
func DomChefPlugin() api.Plugin {
	return api.Plugin{
		Name: "dom-chef",
		Setup: func(build api.PluginBuild) {
			build.OnLoad(api.OnLoadOptions{Filter: `\.tsx$`}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				data, err := ioutil.ReadFile(args.Path)
				if err != nil {
					return api.OnLoadResult{}, err
				}

				contents := strings.Replace(
					string(data),
					"// @use-dom-chef",
					"import { h } from 'dom-chef';",
					1,
				)

				return api.OnLoadResult{
					Contents: &contents,
					Loader:   api.LoaderTSX,
				}, nil
			})
		},
	}
}
