package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"path"
	"time"
)

// setupLogging sets up the default `log` logger to log to both stdout and a
// log file.
func setupLogging(logsDir string) error {
	// Create log file
	logFileName := time.Now().Format("2006-01-02-15_04_05")
	logFile, err := os.OpenFile(path.Join(logsDir, logFileName), os.O_CREATE|os.O_WRONLY, 0755)
	if err != nil {
		return fmt.Errorf(`Error creating log file "%s": %v`, logFileName, err)
	}
	defer logFile.Close()

	// Setup logging to write to stdout and log file
	logWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(logWriter)

	return nil
}
