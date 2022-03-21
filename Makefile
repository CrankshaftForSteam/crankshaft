.PHONY: format format-go format-js

format: format-go format-js

format-go:
	goimports -w .

format-js:
	prettier injected/src/**/* --write