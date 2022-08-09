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
	now := time.Now()
	madeDirs := []*tar.Header{}

	// Attempt to open the file on disk
	file, err := os.Open(archive)
	if err != nil {
		return err
	}
	defer file.Close()

	// Attempt to open this as a gzip, if we can, set reader to the gzip reader
	// otherwise just fall through to see if it's a tar file
	var reader io.Reader = file
	gzipReader, err := gzip.NewReader(file)
	if err == nil {
		reader = gzipReader
	} else {
		// If it wasn't a gzip, reset our offset to the beginning of the file
		file.Seek(0, 0)
	}

	tarReader := tar.NewReader(reader)

	for {
		header, err := tarReader.Next()

		// If no more files found, break from the loop
		if err == io.EOF {
			break
		}

		// If there's some other error, return it
		if err != nil {
			return err
		}

		// Skip extended headers
		if header.Typeflag == tar.TypeXGlobalHeader || header.Typeflag == tar.TypeXHeader {
			continue
		}

		// Build the output path
		relativePath := filepath.FromSlash(header.Name)
		absolutePath := filepath.Join(dest, relativePath)

		// Get the file info and mode
		fileInfo := header.FileInfo()
		fileMode := fileInfo.Mode()

		switch {
		// Handle directory headers
		case fileMode.IsDir():
			// Attempt to make the directory, return on failure
			if err := os.MkdirAll(absolutePath, 0755); err != nil {
				return err
			}

			// Because ordering isn't guaranteed, store the dir header so we can
			// set its attributes after we're finished extracting
			madeDirs = append(madeDirs, header)

		// Handle symlinks
		case header.Typeflag == tar.TypeSymlink:
			// Note: I'm not currently restricting this to the extraction dir
			// but we could pull in SecureJoin if we wanted to do that
			linkTarget := header.Linkname

			// Create the symlink
			if err := os.Symlink(linkTarget, absolutePath); err != nil {
				return err
			}

		// Handle regular files
		case fileMode.IsRegular():
			targetDir := filepath.Dir(absolutePath)

			// Because ordering isn't guaranteed, we need to create the directory
			// if it doesn't exist
			_, err := os.Stat(targetDir)
			if os.IsNotExist(err) {
				if err := os.MkdirAll(targetDir, 0755); err != nil {
					return err
				}
			}

			// Create the file, will truncate if it exists
			file, err := os.Create(absolutePath)
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

			// Chmod the file
			if err := os.Chmod(absolutePath, fileInfo.Mode()); err != nil {
				return err
			}

			// Set the modification time of the file, clamped to the current time
			// For now we'll ignore errors
			modTime := header.ModTime
			if modTime.IsZero() || modTime.After(now) {
				modTime = now
			}

			if err := os.Chtimes(absolutePath, modTime, modTime); err != nil {
				return err
			}

		default:
			return fmt.Errorf("tar file entry %s contained an unsupported file type %v", header.Name, fileMode)
		}
	}

	// Now that we're done, all our directories have been created, so
	// we can set their attributes
	for _, dirHeader := range madeDirs {
		targetDir := filepath.Join(dest, dirHeader.Name)

		// Chmod the directory
		if err := os.Chmod(targetDir, dirHeader.FileInfo().Mode()); err != nil {
			return err
		}

		// Set the modification time of the directory, clamped to the current time
		modTime := dirHeader.ModTime
		if modTime.IsZero() || modTime.After(now) {
			modTime = now
		}

		if err := os.Chtimes(targetDir, modTime, modTime); err != nil {
			return err
		}
	}

	return nil
}
