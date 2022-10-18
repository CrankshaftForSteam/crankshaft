package rpc

type DisableServiceArgs struct{}

type DisableServiceReply struct{}

type HostHasSystemdArgs struct{}

type HostHasSystemdReply struct {
	HasSystemd bool `json:"hasSystemd"`
}

type InstallServiceArgs struct{}

type InstallServiceReply struct{}


type ServiceInstalledArgs struct{}

type ServiceInstalledReply struct {
	ServiceInstalled bool `json:"serviceInstalled"`
}
