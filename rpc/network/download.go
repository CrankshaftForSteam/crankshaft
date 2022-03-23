package network

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"git.sr.ht/~avery/steam-mod-manager/pathutil"
)

type Download struct {
	FinalSize       int64  `json:"finalSize"`
	ProgressBytes   int64  `json:"progress"`
	ProgressPercent string `json:"progressPercent"`
}

func NewDownload(id string, finalSize int64) *Download {
	return &Download{
		FinalSize:       finalSize,
		ProgressBytes:   0,
		ProgressPercent: "0%",
	}
}

func (download *Download) Update(bytesRead int) {
	download.ProgressBytes += int64(bytesRead)
	percent := int(float64(download.ProgressBytes) / float64(download.FinalSize) * 100)
	download.ProgressPercent = fmt.Sprintf("%v%%", percent)
}

type DownloadProgress = map[string]*Download

type DownloadProgressReader struct {
	r io.Reader

	service *NetworkService

	lastLogTime time.Time
	logInterval time.Duration

	ctx        *context.Context
	downloadId string
}

func NewDownloadProgressReader(r io.Reader, ctx *context.Context, service *NetworkService, downloadId string, finalSize int64) *DownloadProgressReader {
	service.DownloadProgress[downloadId] = NewDownload(downloadId, finalSize)

	return &DownloadProgressReader{
		r:           r,
		service:     service,
		logInterval: time.Second,
		ctx:         ctx,
		downloadId:  downloadId,
	}
}

func (dpr *DownloadProgressReader) Read(b []byte) (int, error) {
	bytesRead, readErr := dpr.r.Read(b)

	// Update progress
	if time.Since(dpr.lastLogTime) > dpr.logInterval {
		dpr.lastLogTime = time.Now()
		dpr.service.DownloadProgress[dpr.downloadId].Update(bytesRead)
	}

	// Check if download was cancelled/timed out
	if err := (*dpr.ctx).Err(); err == context.Canceled || err == context.DeadlineExceeded {
		fmt.Println("Download stop")
		return bytesRead, io.EOF
	}

	return bytesRead, readErr
}

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

	downloadCtx, cancel := context.WithTimeout(r.Context(), time.Duration(req.TimeoutSeconds)*time.Second)
	defer cancel()

	_, err = io.Copy(out, NewDownloadProgressReader(getRes.Body, &downloadCtx, service, req.Id, getRes.ContentLength))
	fmt.Println("copied file", req.Url, path)
	if err != nil {
		fmt.Println("Error saving file", req.Url)
		return err
	}

	if downloadErr := downloadCtx.Err(); downloadErr != nil {
		switch downloadErr {
		case context.Canceled:
			fmt.Println("Download cancelled")
			return downloadErr
		case context.DeadlineExceeded:
			fmt.Println("Download timeout")
			res.Status = DownloadStatusTimeout
			return nil
		}
	}

	res.Status = DownloadStatusSuccess

	return nil
}
