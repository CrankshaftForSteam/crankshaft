ifeq ($(OS),Windows_NT)
	CMDQUIET = >nul 2>nul || (exit 0)
	RMDIR = rmdir /Q /S
	FixPath = $(subst /,\,$1)
else
	CMDQUIET := >/dev/null 2>&1
	RMDIR = rm -rf
	FixPath = $1
endif

.PHONY: configure-git-hooks
configure-git-hooks:
	git config core.hooksPath .githooks

.PHONY: install-js-deps
install-js-deps:
	cd injected && \
	yarn

.PHONY: clean
clean:
	$(RMDIR) $(call FixPath, .build) $(CMDQUIET)
	$(RMDIR) $(call FixPath, .dist) $(CMDQUIET)
	$(RMDIR) $(call FixPath, rpc/inject/scripts) $(CMDQUIET)

.PHONY: run
run: clean
	go build -tags=dev -o crankshaft ./cmd/crankshaft/
	./crankshaft -no-cache $(ARGS)

.PHONY: test
test:
	go test -tags=dev ./...

.PHONY: serve-docs
serve-docs:
	godoc -http=:8878

.PHONY: check-types
check-types:
	cd injected && \
	yarn tsc

.PHONY: format
format: format-go format-js

.PHONY: format-go
format-go:
	goimports -w .

.PHONY: format-js
format-js:
	cd injected && \
	yarn prettier src --write

.PHONY: bundle-scripts
bundle-scripts:
	go run cmd/bundle-scripts/main.go

.PHONY: build
build: bundle-scripts
	mkdir -p rpc/inject/scripts
	cp .build/* rpc/inject/scripts
	go run cmd/bundle-scripts/main.go
	go build -o crankshaft cmd/crankshaft/*.go

.PHONY: flatpak
flatpak: bundle-scripts
	mkdir -p rpc/inject/scripts
	cp .build/* rpc/inject/scripts
	go run cmd/bundle-scripts/main.go
	go build -tags=flatpak -o crankshaft cmd/crankshaft/*.go

.PHONY: patch-flatpak
patch-flatpak: flatpak
	systemctl --user stop crankshaft.service
	cp crankshaft $(shell flatpak info -l space.crankshaft.Crankshaft)/files/bin/crankshaft
	systemctl --user start crankshaft.service

.PHONY: api-extractor
api-extractor:
	./scripts/api-extractor