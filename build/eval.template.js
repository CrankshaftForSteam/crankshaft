// Cleanup previous SMM code
document.querySelectorAll('[data-smm-id]').forEach((node) => node.remove());

window.smmServerPort = '{{ .ServerPort }}';
window.smmUIMode = '{{ .UIMode }}';
window.csSteamDir  = '{{ .SteamDir }}';
window.csVersion = '{{ .Version }}';
window.csAuthToken = '{{ .AuthToken }}';

{{ .InjectedScript }}