.PHONY: configure-git-hooks
configure-git-hooks:
	git config core.hooksPath .githooks

.PHONY: install-js-deps
install-js-deps:
	cd injected && \
	yarn

.PHONY: clean
clean:
	rm -rf .build
	rm -rf .dist
	rm -rf rpc/inject/scripts

.PHONY: run
run: clean
	go run -tags=dev cmd/crankshaft/*.go -no-cache $(ARGS)

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
	mkdir rpc/inject/scripts
	cp .build/* rpc/inject/scripts
	go run cmd/bundle-scripts/main.go
	go build -o crankshaft cmd/crankshaft/*.go

.PHONY: flatpak
flatpak: bundle-scripts
	mkdir rpc/inject/scripts
	cp .build/* rpc/inject/scripts
	go run cmd/bundle-scripts/main.go
	go build -tags=flatpak -o crankshaft cmd/crankshaft/*.go

.PHONY: api-extractor
api-extractor:
	./scripts/api-extractor