package rpc

import (
	"net/http"

	"git.sr.ht/~avery/crankshaft/autostart"
)

type AutoupdateService struct {
	dataDir string
	unitName string
	timerName string
}

func NewAutoupdateService(dataDir string, unitName string, timerName string) *AutoupdateService {
	return &AutoupdateService{dataDir, unitName, timerName}
}

func (service *AutoupdateService) DisableService(r *http.Request, req *DisableServiceArgs, res *DisableServiceReply) error {
	autostart.DisableService(service.timerName)
	return autostart.DisableService(service.unitName)
}

func (service *AutoupdateService) HostHasSystemd(r *http.Request, req *HostHasSystemdArgs, res *HostHasSystemdReply) error {
	res.HasSystemd = autostart.HostHasSystemd()
	return nil
}

func (service *AutoupdateService) InstallService(r *http.Request, req *InstallServiceArgs, res *InstallServiceReply) error {
	autostart.InstallService(service.dataDir, service.timerName)
	return autostart.InstallService(service.dataDir, service.unitName)
}

func (service *AutoupdateService) ServiceInstalled(r *http.Request, req *ServiceInstalledArgs, res *ServiceInstalledReply) error {
	res.ServiceInstalled = autostart.ServiceInstalled(service.unitName)
	return nil
}
