package build

import (
	"errors"
	"log"

	"github.com/evanw/esbuild/pkg/api"
)

func checkErrors(buildErrors []api.Message) error {
	if len(buildErrors) == 0 {
		return nil
	}

	for i, err := range buildErrors {
		log.Printf("[ERROR] %d : %s %d:%d\n", i+1, err.Location.File, err.Location.Line, err.Location.Column)
		log.Println("    " + err.Text)
	}

	return errors.New("Error building scripts")
}

func checkWarnings(buildWarnings []api.Message) {
	for i, err := range buildWarnings {
		log.Printf("[WARN] %d : %s %d:%d\n", i+1, err.Location.File, err.Location.Line, err.Location.Column)
		log.Println("    " + err.Text)
	}
}
