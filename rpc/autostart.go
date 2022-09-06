package rpc

import (
	"net/http"

	"git.sr.ht/~avery/crankshaft/autostart"
)

type AutostartService struct {
	dataDir string
	unitName string
}

func NewAutostartService(dataDir string, unitName string) *AutostartService {
	return &AutostartService{dataDir, unitName}
}

func (service *AutostartService) DisableService(r *http.Request, req *DisableServiceArgs, res *DisableServiceReply) error {
	return autostart.DisableService(service.unitName)
}

func (service *AutostartService) HostHasSystemd(r *http.Request, req *HostHasSystemdArgs, res *HostHasSystemdReply) error {
	res.HasSystemd = autostart.HostHasSystemd()
	return nil
}

func (service *AutostartService) InstallService(r *http.Request, req *InstallServiceArgs, res *InstallServiceReply) error {
	return autostart.InstallService(service.dataDir, service.unitName)
}

func (service *AutostartService) ServiceInstalled(r *http.Request, req *ServiceInstalledArgs, res *ServiceInstalledReply) error {
	res.ServiceInstalled = autostart.ServiceInstalled(service.unitName)
	return nil
}
