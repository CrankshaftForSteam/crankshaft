package network

import (
	"context"
	"io"
	"log"
)

type DownloadProgressReader struct {
	r io.Reader

	service *NetworkService

	ctx        *context.Context
	downloadId string
}

func NewDownloadProgressReader(r io.Reader, ctx *context.Context, service *NetworkService, downloadId string, finalSizeBytes int64) *DownloadProgressReader {
	service.DownloadProgress[downloadId] = NewDownload(downloadId, finalSizeBytes)

	return &DownloadProgressReader{
		r:          r,
		service:    service,
		ctx:        ctx,
		downloadId: downloadId,
	}
}

func (dpr *DownloadProgressReader) Read(b []byte) (int, error) {
	bytesRead, readErr := dpr.r.Read(b)

	dpr.service.DownloadProgress[dpr.downloadId].Update(bytesRead)

	// Check if download was cancelled/timed out
	if err := (*dpr.ctx).Err(); err == context.Canceled || err == context.DeadlineExceeded {
		log.Println("Download stopped", dpr.downloadId)
		return bytesRead, io.EOF
	}

	return bytesRead, readErr
}
