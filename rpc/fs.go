package rpc

import (
	"log"
	"net/http"
	"os"
	"os/exec"

	"git.sr.ht/~avery/crankshaft/pathutil"
)

type FSService struct{}

type ListDirArgs struct {
	Path string `json:"path"`
}

type Content struct {
	Name  string `json:"name"`
	IsDir bool   `json:"isDir"`
}

type ListDirReply struct {
	Contents []Content `json:"contents"`
}

func (service *FSService) ListDir(r *http.Request, req *ListDirArgs, res *ListDirReply) error {
	path := pathutil.SubstituteHomeDir(req.Path)

	c, err := os.ReadDir(path)
	if err != nil {
		log.Println("Error reading dir", err)
		return err
	}

	res.Contents = []Content{}
	for _, entry := range c {
		res.Contents = append(res.Contents, Content{
			Name:  entry.Name(),
			IsDir: entry.IsDir(),
		})
	}

	return nil
}

type ReadFileArgs struct {
	Path string `json:"path"`
}

type ReadFileReply struct {
	Data string `json:"data"`
}

func (service *FSService) ReadFile(r *http.Request, req *ReadFileArgs, res *ReadFileReply) error {
	path := pathutil.SubstituteHomeDir(req.Path)

	data, err := os.ReadFile(path)
	if err != nil {
		log.Println("Error reading file", err)
		return err
	}

	res.Data = string(data)

	return nil
}

type UntarArgs struct {
	TarPath  string `json:"tarPath"`
	DestPath string `json:"destPath"`
}

type UntarReply struct{}

func (service *FSService) Untar(r *http.Request, req *UntarArgs, res *UntarReply) error {
	tarPath := pathutil.SubstituteHomeDir(req.TarPath)
	destPath := pathutil.SubstituteHomeDir(req.DestPath)

	// TODO: handle errors when im not tired
	cmd := exec.Command("tar", "-xf", tarPath, "-C", destPath)
	log.Println("untar command", cmd.String())
	_ = cmd.Run()

	/*
		 * archive/tar seems to not handle symlinks :(
		 * need to look into it more, using tar for now

		f, err := os.Open(tarPath)
		if err != nil {
			log.Println("Error opening tar file", tarPath)
			return err
		}
		defer f.Close()

		err = untar.Untar(f, destPath)
		if err != nil {
			log.Println("Error untaring file", tarPath, destPath)
			return err
		}
	*/

	return nil
}
