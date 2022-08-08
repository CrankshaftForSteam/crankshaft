package rpc

import (
	"log"
	"net/http"
	"os"

	"git.sr.ht/~avery/crankshaft/executil"
	"git.sr.ht/~avery/crankshaft/pathutil"
)

type FSService struct {
	pluginsDir string
}

func NewFSService(pluginsDir string) *FSService {
	return &FSService{pluginsDir}
}

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
	path := pathutil.SubstituteHomeAndXdg(req.Path)

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

type MakeDirArgs struct {
	Path    string `json:"path"`
	Parents bool   `json:"parents"`
}

type MakeDirReply struct{}

func (service *FSService) MkDir(r *http.Request, req *MakeDirArgs, res *MakeDirReply) error {
	path := pathutil.SubstituteHomeAndXdg(req.Path)
	if req.Parents {
		// TODO: allow specifying mode
		return os.MkdirAll(path, 0755)
	}
	return os.Mkdir(path, 0755)
}

type ReadFileArgs struct {
	Path string `json:"path"`
}

type ReadFileReply struct {
	Data string `json:"data"`
}

func (service *FSService) ReadFile(r *http.Request, req *ReadFileArgs, res *ReadFileReply) error {
	path := pathutil.SubstituteHomeAndXdg(req.Path)

	data, err := os.ReadFile(path)
	if err != nil {
		log.Println("Error reading file", err)
		return err
	}

	res.Data = string(data)

	return nil
}

type RemoveFileArgs struct {
	Path string `json:"path"`
}

type RemoveFileReply struct {
}

func (service *FSService) RemoveFile(r *http.Request, req *RemoveFileArgs, res *RemoveFileReply) error {
	path := pathutil.SubstituteHomeAndXdg(req.Path)

	err := os.Remove(path)
	if err != nil {
		log.Println("Error removing file", err)
		return err
	}

	return nil
}

type UntarArgs struct {
	TarPath  string `json:"tarPath"`
	DestPath string `json:"destPath"`
}

type UntarReply struct{}

func (service *FSService) Untar(r *http.Request, req *UntarArgs, res *UntarReply) error {
	tarPath := pathutil.SubstituteHomeAndXdg(req.TarPath)
	destPath := pathutil.SubstituteHomeAndXdg(req.DestPath)

	// TODO: handle errors when im not tired
	cmd := executil.Command("tar", "-xf", tarPath, "-C", destPath)
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

type GetPluginsPathArgs struct{}

type GetPluginsPathReply struct {
	Path string `json:"path"`
}

func (service *FSService) GetPluginsPath(r *http.Request, req *GetPluginsPathArgs, res *GetPluginsPathReply) error {
	res.Path = service.pluginsDir

	return nil
}
