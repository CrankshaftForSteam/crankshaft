// Loosely based on the concept of extraction from Go's untar method:
// https://github.com/golang/build/blob/master/internal/untar/untar.go

package untar

import (
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
)

// Untar takes an archive path, and destination path, and processes the specified
// archive, extracting all files and creating the structure along the way
func Untar(archive string, dest string) error {
	return untar(archive, dest)
}

func untar(archive string, dest string) (err error) {
	t0 := time.Now()
	madeDirs := map[string]bool{}

	// Attempt to open the file on disk
	reader, err := os.Open(archive)
	if err != nil {
		return err
	}
	defer reader.Close()

	// We'll assume all archives are gzip'd
	gzipReader, err := gzip.NewReader(reader)
	if err != nil {
		return fmt.Errorf("requires gzip-compressed archive: %v", err)
	}

	tarReader := tar.NewReader(gzipReader)

	for {
		header, err := tarReader.Next()

		// If no more files found, exit
		if err == io.EOF {
			break
		}

		// If there's some other error, return it
		if err != nil {
			return err
		}

		// Build the output path
		relativePath := filepath.FromSlash(header.Name)
		absolutePath := filepath.Join(dest, relativePath)

		// Get the file info and mode
		fileInfo := header.FileInfo()
		fileMode := fileInfo.Mode()

		switch {
		case fileMode.IsRegular():
			targetDir := filepath.Dir(absolutePath)
			// We'll attempt to make the dir, but ignore if it fails, as it should have been handled already
			if !madeDirs[targetDir] {
				os.MkdirAll(targetDir, 0755)
				madeDirs[targetDir] = true
			}

			file, err := os.OpenFile(absolutePath, os.O_RDWR|os.O_CREATE|os.O_TRUNC, fileMode.Perm())
			if err != nil {
				return err
			}

			// Copy the contents to the new file, and verify it was written
			written, err := io.Copy(file, tarReader)
			closeErr := file.Close()
			if closeErr != nil {
				return closeErr
			}
			if err != nil {
				return err
			}
			if written != fileInfo.Size() {
				return fmt.Errorf("incorrect amount of data written for %s. Expected: %d  Actual: %d", absolutePath, fileInfo.Size(), written)
			}

			// Set the modification time of the file, clamped to the current time
			// For now we'll ignore errors
			modTime := header.ModTime
			if modTime.After(t0) {
				modTime = t0
			}
			if !modTime.IsZero() {
				os.Chtimes(absolutePath, modTime, modTime)
			}
		case fileMode.IsDir():
			err := os.MkdirAll(absolutePath, 0755)
			if err != nil {
				return err
			}
			madeDirs[absolutePath] = true

		default:
			return fmt.Errorf("tar file entry %s contained an unsupported file type %v", header.Name, fileMode)
		}
	}

	return nil
}
