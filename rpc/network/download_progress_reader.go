package network

import (
	"context"
	"fmt"
	"io"
	"time"
)

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
