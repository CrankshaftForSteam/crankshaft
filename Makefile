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
	go run -tags=dev cmd/crankshaft/crankshaft.go -no-cache $(ARGS)

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
	go build -o .dist/crankshaft cmd/crankshaft/crankshaft.go
	# Get js-beautify binary
	# See source and build manifest at: https://builds.sr.ht/~avery/job/741873
	# TODO: this link expires in 90 days lol
	wget -O .dist/js-beautify https://patchouli.sr.ht/builds.sr.ht/artifacts/~avery/741873/249ceb5c7c3dfa54/js-beautify
	chmod +x .dist/js-beautify

.PHONY: flatpak
flatpak: bundle-scripts
	mkdir rpc/inject/scripts
	cp .build/* rpc/inject/scripts
	go run cmd/bundle-scripts/main.go
	go build -tags=flatpak -o crankshaft cmd/crankshaft/crankshaft.go

.PHONY: api-extractor
api-extractor:
	./scripts/api-extractor