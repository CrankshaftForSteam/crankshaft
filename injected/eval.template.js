{
	// Cleanup previous SMM code
	document.querySelectorAll('[data-smm-id]').forEach((node) => node.remove());

	window.smmServerPort = '{{ .ServerPort }}';

	const scriptEl = document.createElement('script');
	scriptEl.dataset.smmId = 'injected';
	scriptEl.dataset.smmVer = '{{ .Version }}';
	scriptEl.innerHTML = `{{ .InjectedScript }}`;
	document.querySelector('body').appendChild(scriptEl);
}