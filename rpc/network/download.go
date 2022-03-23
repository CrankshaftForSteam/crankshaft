package network

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"

	"git.sr.ht/~avery/steam-mod-manager/pathutil"
)

type DownloadArgs struct {
	Url  string `json:"url"`
	Path string `json:"path"`
}

type DownloadReply struct{}

func (service *NetworkService) Download(r *http.Request, req *DownloadArgs, res *DownloadReply) error {
	path := pathutil.SubstituteHomeDir(req.Path)

	out, err := os.Create(path)
	fmt.Println("Created file", path)
	if err != nil {
		fmt.Println("Error creating download file", req.Url)
		return err
	}
	defer out.Close()

	getRes, err := http.Get(req.Url)
	fmt.Println("got file", req.Url)
	if err != nil {
		fmt.Println("Error getting download", req.Url)
		return err
	}
	if getRes.StatusCode != 200 {
		fmt.Println("Download returned non-200 status", req.Url)
		return errors.New("Download returned non-200 status")
	}
	defer getRes.Body.Close()

	_, err = io.Copy(out, getRes.Body)
	fmt.Println("copied file", req.Url, path)
	if err != nil {
		fmt.Println("Error saving file", req.Url)
		return err
	}

	return nil
}
