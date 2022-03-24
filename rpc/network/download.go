package network

import (
	"fmt"
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
