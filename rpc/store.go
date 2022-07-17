package rpc

import (
	"log"
	"net/http"
	"path"

	"github.com/boltdb/bolt"
)

type StoreService struct {
	db *bolt.DB
}

func NewStoreService(dataDir string) *StoreService {
	dbPath := path.Join(dataDir, "store.db")
	db, err := bolt.Open(dbPath, 0600, nil)
	if err != nil {
		// TODO: this error could maybe be handled better
		log.Fatalf(`StoreService database not found at "%s"`, dbPath)
	}

	return &StoreService{db}
}

type GetArgs struct {
	Bucket string `json:"bucket"`
	Key    string `json:"key"`
}

type GetReply struct {
	Found bool   `json:"found"`
	Value string `json:"value"`
}

func (service *StoreService) Get(r *http.Request, req *GetArgs, res *GetReply) error {
	return service.db.View(func(tx *bolt.Tx) error {
		res.Found = false
		res.Value = ""

		b := tx.Bucket([]byte(req.Bucket))
		if b == nil {
			return nil
		}

		val := b.Get([]byte(req.Key))
		if val == nil {
			return nil
		}

		res.Found = true
		res.Value = string(val)
		return nil
	})
}

type SetArgs struct {
	Bucket string `json:"bucket"`
	Key    string `json:"key"`
	Value  string `json:"value"`
}

type SetReply struct{}

func (service *StoreService) Set(r *http.Request, req *SetArgs, res *SetReply) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(req.Bucket))
		if err != nil {
			return err
		}

		return b.Put([]byte(req.Key), []byte(req.Value))
	})
}
