package network

type NetworkService struct {
	DownloadProgress
}

func NewNetworkService() *NetworkService {
	return &NetworkService{DownloadProgress: make(DownloadProgress)}
}
