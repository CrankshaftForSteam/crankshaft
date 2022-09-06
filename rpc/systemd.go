package rpc

import (
	"net/http"

	"git.sr.ht/~avery/crankshaft/autostart"
)

type SystemdService struct {
	dataDir string
	unitName string
}

func NewSystemdService(dataDir string, unitName string) *SystemdService {
	return &SystemdService{dataDir, unitName}
}

type DisableServiceArgs struct{}

type DisableServiceReply struct{}

func (service *SystemdService) DisableService(r *http.Request, req *DisableServiceArgs, res *DisableServiceReply) error {
	return autostart.DisableService(service.unitName)
}

type HostHasSystemdArgs struct{}

type HostHasSystemdReply struct {
	HasSystemd bool `json:"hasSystemd"`
}

func (service *SystemdService) HostHasSystemd(r *http.Request, req *HostHasSystemdArgs, res *HostHasSystemdReply) error {
	res.HasSystemd = autostart.HostHasSystemd()
	return nil
}

type InstallServiceArgs struct{}

type InstallServiceReply struct{}

func (service *SystemdService) InstallService(r *http.Request, req *InstallServiceArgs, res *InstallServiceReply) error {
	return autostart.InstallService(service.dataDir, service.unitName)
}

type ServiceInstalledArgs struct{}

type ServiceInstalledReply struct {
	ServiceInstalled bool `json:"serviceInstalled"`
}

func (service *SystemdService) ServiceInstalled(r *http.Request, req *ServiceInstalledArgs, res *ServiceInstalledReply) error {
	res.ServiceInstalled = autostart.ServiceInstalled(service.unitName)
	return nil
}
