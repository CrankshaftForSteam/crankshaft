package rpc

import (
	"bytes"
	"errors"
	"fmt"
	"net/http"
	"os/exec"
	"strings"
	"syscall"

	"git.sr.ht/~avery/crankshaft/executil"
)

type pid = int

type CmdInfo struct {
	pid         pid
	cmd         *exec.Cmd
	stdoutBytes bytes.Buffer
	stderrBytes bytes.Buffer
}

type ExecService struct {
	Commands map[pid]*CmdInfo
}

func NewExecService() *ExecService {
	return &ExecService{
		Commands: make(map[int]*CmdInfo),
	}
}

type RunArgs struct {
	Command string   `json:"command"`
	Args    []string `json:"args"`
}

type RunReply struct {
	ExitCode int    `json:"exitCode"`
	Stdout   string `json:"stdout"`
	Stderr   string `json:"stderr"`
}

func (service *ExecService) Run(r *http.Request, req *RunArgs, res *RunReply) error {
	cmd := executil.Command(req.Command, req.Args...)

	var stdoutBytes, stderrBytes bytes.Buffer
	cmd.Stdout = &stdoutBytes
	cmd.Stderr = &stderrBytes

	err := cmd.Run()
	if errors.Is(err, exec.ErrNotFound) {
		// If executable wasn't found, cause HTTP request error
		// Otherwise, we want to return an exit code and stderr, so we don't return
		// a request error
		return err
	}

	res.ExitCode = cmd.ProcessState.ExitCode()
	res.Stdout = strings.TrimSpace(stdoutBytes.String())
	res.Stderr = strings.TrimSpace(stderrBytes.String())

	return nil
}

type StartArgs struct {
	Command string   `json:"command"`
	Args    []string `json:"args"`
}

type StartReply struct {
	Pid int `json:"pid"`
}

func (service *ExecService) Start(r *http.Request, req *StartArgs, res *StartReply) error {
	var cmdInfo CmdInfo

	cmdInfo.cmd = executil.Command(req.Command, req.Args...)
	cmdInfo.cmd.Stdout = &cmdInfo.stdoutBytes
	cmdInfo.cmd.Stderr = &cmdInfo.stderrBytes

	err := cmdInfo.cmd.Start()
	if err != nil {
		return err
	}

	cmdInfo.pid = cmdInfo.cmd.Process.Pid
	res.Pid = cmdInfo.pid

	service.Commands[cmdInfo.pid] = &cmdInfo

	return nil
}

type StopArgs struct {
	Pid  int  `json:"pid"`
	Kill bool `json:"kill"`
}

type StopReply struct {
	ExitCode int    `json:"exitCode"`
	Stdout   string `json:"stdout"`
	Stderr   string `json:"stderr"`
}

func (service *ExecService) Stop(r *http.Request, req *StopArgs, res *StopReply) error {
	cmdInfo, found := service.Commands[req.Pid]
	if !found {
		return fmt.Errorf(`Process with PID "%d" not found`, req.Pid)
	}

	process := cmdInfo.cmd.Process

	// Stop the process
	if req.Kill {
		process.Signal(syscall.SIGKILL)
	} else {
		process.Signal(syscall.SIGINT)
	}

	state, err := process.Wait()
	if err != nil {
		return err
	}

	res.ExitCode = state.ExitCode()
	res.Stdout = strings.TrimSpace(cmdInfo.stdoutBytes.String())
	res.Stderr = strings.TrimSpace(cmdInfo.stderrBytes.String())

	return nil
}
