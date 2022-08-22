package ps

import (
	"log"
	"strings"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
)

const processEntrySize = (uint32)(unsafe.Sizeof(windows.ProcessEntry32{}))

// IsSteamRunning checks if the steamwebhelper process is running.
func IsSteamRunning() bool {
	handle, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return false
	}

	proc := windows.ProcessEntry32{Size: processEntrySize}
	for {
		err = windows.Process32Next(handle, &proc)
		if err != nil {
			break
		}
		procExe := windows.UTF16ToString(proc.ExeFile[:])
		if strings.Contains(procExe, "steamwebhelper") {
			return true
		}
	}

	return false
}

// WaitForSteamProcess waits for the steamwebhelper process to start.
func WaitForSteamProcess() {
	log.Println("Waiting for steamwebhelper...")
	for {
		if IsSteamRunning() {
			break
		}
		time.Sleep(1 * time.Second)
	}
	log.Println("steamwebhelper found!")
}

// WaitForSteamProcessToStop waits for the steamwebhelper process to stop.
func WaitForSteamProcessToStop() {
	for {
		if !IsSteamRunning() {
			break
		}
		time.Sleep(1 * time.Second)
	}
}
