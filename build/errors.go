package build

import (
	"errors"
	"fmt"

	"github.com/evanw/esbuild/pkg/api"
)

func checkErrors(buildErrors []api.Message) error {
	if len(buildErrors) == 0 {
		return nil
	}

	for i, err := range buildErrors {
		fmt.Printf("[ERROR] %d : %s %d:%d\n", i+1, err.Location.File, err.Location.Line, err.Location.Column)
		fmt.Println("    " + err.Text)
	}

	return errors.New("Error building scripts")
}

func checkWarnings(buildWarnings []api.Message) {
	for i, err := range buildWarnings {
		fmt.Printf("[WARN] %d : %s %d:%d\n", i+1, err.Location.File, err.Location.Line, err.Location.Column)
		fmt.Println("    " + err.Text)
	}
}
