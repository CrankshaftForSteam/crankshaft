.PHONY: configure-git-hooks
configure-git-hooks:
	git config core.hooksPath .githooks

.PHONY: clean
clean:
	rm -rf .build
	rm -rf .dist

.PHONY: run
run: clean
	go run cmd/crankshaft/main.go $(ARGS)

.PHONY: test
test:
	go test ./...

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
