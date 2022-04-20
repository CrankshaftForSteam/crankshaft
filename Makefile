.PHONY: configure-git-hooks
configure-git-hooks:
	git config core.hooksPath .githooks

.PHONY: clean
clean:
	rm -rf .build
	rm -rf .dist
	rm -rf rpc/inject/scripts

.PHONY: run
run: clean
	go run -tags=dev cmd/crankshaft/main.go $(ARGS)

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

.PHONY: release
release: clean bundle-scripts
	mkdir rpc/inject/scripts
	cp .build/* rpc/inject/scripts
	mkdir .dist
	go build -o .dist/crankshaft cmd/crankshaft/main.go