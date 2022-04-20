package main

import (
	"log"

	"git.sr.ht/~avery/crankshaft/build"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("Error: %v", err)
	}
}

func run() error {
	if err := build.BundleScripts(); err != nil {
		return err
	}

	if _, err := build.BundleSharedScripts(); err != nil {
		return err
	}

	return nil
}
