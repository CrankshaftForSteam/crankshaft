.PHONY: configure-git-hooks clean run format format-go format-js

configure-git-hooks:
	git config core.hooksPath .githooks

clean:
	rm -rf .build

run: clean
	go run .

format: format-go format-js

format-go:
	goimports -w .

format-js:
	cd injected && \
	yarn prettier src --write