.PHONY: configure-git-hooks clean run test serve-docs check-types format format-go format-js

configure-git-hooks:
	git config core.hooksPath .githooks

clean:
	rm -rf .build

run: clean
	go run .

test:
	go test ./...

serve-docs:
	godoc -http=:8878

check-types:
	cd injected && \
	yarn tsc

format: format-go format-js

format-go:
	goimports -w .

format-js:
	cd injected && \
	yarn prettier src --write