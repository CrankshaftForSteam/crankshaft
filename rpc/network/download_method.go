package network

import (
	"context"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"git.sr.ht/~avery/crankshaft/pathutil"
)

type DownloadArgs struct {
	Url            string `json:"url"`
	Path           string `json:"path"`
	Id             string `json:"id"`
	TimeoutSeconds int    `json:"timeoutSeconds"`
}

type DownloadStatus string

const (
	DownloadStatusSuccess DownloadStatus = "success"
	DownloadStatusTimeout                = "timeout"
)

type DownloadReply struct {
	Status DownloadStatus `json:"status"`
}

func (service *NetworkService) Download(r *http.Request, req *DownloadArgs, res *DownloadReply) error {
	path := pathutil.SubstituteHomeAndXdg(req.Path)

	out, err := os.Create(path)
	log.Println("Created file", path)
	if err != nil {
		log.Println("Error creating download file", req.Url)
		return err
	}
	defer out.Close()

	getRes, err := http.Get(req.Url)
	log.Println("got file", req.Url)
	if err != nil {
		log.Println("Error getting download", req.Url)
		return err
	}
	if getRes.StatusCode != 200 {
		log.Println("Download returned non-200 status", req.Url)
		return errors.New("Download returned non-200 status")
	}
	defer getRes.Body.Close()

	downloadCtx, cancel := context.WithTimeout(r.Context(), time.Duration(req.TimeoutSeconds)*time.Second)
	defer cancel()

	_, err = io.Copy(out, NewDownloadProgressReader(getRes.Body, &downloadCtx, service, req.Id, getRes.ContentLength))
	log.Println("copied file", req.Url, path)
	if err != nil {
		log.Println("Error saving file", req.Url)
		return err
	}

	if downloadErr := downloadCtx.Err(); downloadErr != nil {
		switch downloadErr {
		case context.Canceled:
			log.Println("Download cancelled")
			return downloadErr
		case context.DeadlineExceeded:
			log.Println("Download timeout")
			res.Status = DownloadStatusTimeout
			return nil
		}
	}

	res.Status = DownloadStatusSuccess

	return nil
}
