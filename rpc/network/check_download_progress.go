package network

import (
	"errors"
	"net/http"
)

type CheckDownloadProgressArgs struct {
	Id string `json:"id"`
}

type CheckDownloadProgressReply struct {
	Download
	ProgressPercent int `json:"progressPercent"`
}

func (service *NetworkService) CheckDownloadProgress(r *http.Request, req *CheckDownloadProgressArgs, res *CheckDownloadProgressReply) error {
	download, ok := service.DownloadProgress[req.Id]
	if !ok {
		return errors.New("Download ID not found: " + req.Id)
	}

	res.FinalSizeBytes = download.FinalSizeBytes
	res.ProgressBytes = download.ProgressBytes

	res.ProgressPercent = int(float64(download.ProgressBytes) / float64(download.FinalSizeBytes) * 100)

	return nil
}
