package network

type Download struct {
	FinalSizeBytes int64 `json:"finalSizeBytes"`
	ProgressBytes  int64 `json:"progressBytes"`
}

func NewDownload(id string, finalSizeBytes int64) *Download {
	return &Download{
		FinalSizeBytes: finalSizeBytes,
		ProgressBytes:  0,
	}
}

func (download *Download) Update(bytesRead int) {
	download.ProgressBytes += int64(bytesRead)
}

type DownloadProgress = map[string]*Download
