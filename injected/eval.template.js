{
	// Cleanup previous SMM code
	document.querySelectorAll('[data-smm-id]').forEach((node) => node.remove());

	window.smmServerPort = '{{ .ServerPort }}';
	window.smmUIMode = '{{ .UIMode }}';

	{{ .InjectedScript }}
}