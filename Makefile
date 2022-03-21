.PHONY: configure-git-hooks format format-go format-js

configure-git-hooks:
	git config core.hooksPath .githooks

format: format-go format-js

format-go:
	goimports -w .

format-js:
	prettier injected/src/**/* --write