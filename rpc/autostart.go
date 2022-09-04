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

type HostHasSystemdArgs struct{}

type HostHasSystemdReply struct {
	HasSystemd bool `json:"hasSystemd"`
}

func (service *AutostartService) HostHasSystemd(r *http.Request, req *HostHasSystemdArgs, res *HostHasSystemdReply) error {
	res.HasSystemd = autostart.HostHasSystemd()
	return nil
}

type ServiceInstalledArgs struct{}

type ServiceInstalledReply struct {
	ServiceInstalled bool `json:"serviceInstalled"`
}

func (service *AutostartService) ServiceInstalled(r *http.Request, req *ServiceInstalledArgs, res *ServiceInstalledReply, unit string) error {
	res.ServiceInstalled = autostart.ServiceInstalled(unit)
	return nil
}

type InstallServiceArgs struct{}

type InstallServiceReply struct{}

func (service *AutostartService) InstallService(r *http.Request, req *InstallServiceArgs, res *InstallServiceReply) error {
	return autostart.InstallService(service.dataDir, service.unitName)
}

type DisableServiceArgs struct{}

type DisableServiceReply struct{}

func (service *AutostartService) DisableService(r *http.Request, req *DisableServiceArgs, res *DisableServiceReply) error {
	return autostart.DisableService(service.unitName)
}
