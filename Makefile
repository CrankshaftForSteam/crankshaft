.PHONY: configure-git-hooks run format format-go format-js

configure-git-hooks:
	git config core.hooksPath .githooks

run:
	go run .

format: format-go format-js

format-go:
	goimports -w .

format-js:
	prettier injected/src/**/* --write