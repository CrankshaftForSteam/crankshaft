package rpc

import (
	"net/http"

	"git.sr.ht/~avery/crankshaft/autostart"
)

type AutoupdateService struct {
	dataDir string
	unitName string
}

func NewAutoupdateService(dataDir string, unitName string) *AutoupdateService {
	return &AutoupdateService{dataDir, unitName}
}

func (service *AutoupdateService) DisableService(r *http.Request, req *DisableServiceArgs, res *DisableServiceReply) error {
	return autostart.DisableService(service.unitName)
}

func (service *AutoupdateService) HostHasSystemd(r *http.Request, req *HostHasSystemdArgs, res *HostHasSystemdReply) error {
	res.HasSystemd = autostart.HostHasSystemd()
	return nil
}

func (service *AutoupdateService) InstallService(r *http.Request, req *InstallServiceArgs, res *InstallServiceReply) error {
	return autostart.InstallService(service.dataDir, service.unitName)
}

func (service *AutoupdateService) ServiceInstalled(r *http.Request, req *ServiceInstalledArgs, res *ServiceInstalledReply) error {
	res.ServiceInstalled = autostart.ServiceInstalled(service.unitName)
	return nil
}
