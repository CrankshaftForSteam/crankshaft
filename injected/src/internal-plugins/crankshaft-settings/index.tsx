import { SMM } from '../../SMM';

export const load = (smm: SMM) => {
  smm.MenuManager.addMenuItem({
    id: 'crankshaft-settings',
    label: 'Crankshaft Settings',
    render: showPlugin,
  });
};

const showPlugin = async (smm: SMM) => {
  const container = <div style={{ padding: '4px 12px' }} />;

  const render = async () => {
    const contents = (
      <>
        <h1 style={{ fontSize: 24, margin: 'unset', marginBottom: 16 }}>
          Crankshaft Settings
        </h1>

        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {await devtools(render, smm)}
          {cefDebugToggle(render)}
        </ul>
      </>
    );

    container.innerHTML = '';
    container.appendChild(contents);
  };

  await render();

  return container;
};

const item = (title: string, contents: JSX.Element) => (
  <li
    style={{
      display: 'block',
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      padding: '8px 0',
      marginBottom: 12,
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: '4px 12px',
      }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>
      {contents}
    </div>
  </li>
);

let devtoolsFrontendUrl: string;

const devtools = async (render: () => void, smm: SMM) => {
  if (!devtoolsFrontendUrl) {
    const targets = await smm.Network.get<
      {
        title: string;
        devtoolsFrontendUrl: string;
      }[]
    >('http://localhost:8080/json');

    const libraryTarget = targets.find((t) => t.title === 'SP');
    if (libraryTarget) {
      devtoolsFrontendUrl =
        'devtools://devtools/bundled/inspector.html?experiments=true&' +
        libraryTarget.devtoolsFrontendUrl.replace(
          `/devtools/inspector.html?`,
          ''
        );
    }
  }

  return item(
    'Open Chrome devtools',
    <>
      <p style={{ margin: '4px 0 0 0' }}>
        Paste the below URL into a Chromium-based browser to open devtools for
        the Steam Client:
        {(
          <span
            style={{
              display: 'inline-block',
              marginTop: 8,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}
          >
            {devtoolsFrontendUrl}
          </span>
        ) ?? <i>Devtools URL not found...</i>}
      </p>
    </>
  );
};

const cefDebugToggle = (render: () => void) => {
  const enabled = window.settingsStore.m_Settings.bCefRemoteDebuggingEnabled;

  const handleToggle = () => {
    window.SteamClient.Settings.SetCefRemoteDebuggingEnabled(!enabled);
    render();
  };

  return item(
    `Steam Client CEF debugging`,
    <>
      <p style={{ margin: '0 0 8px 0' }}>
        <b>{enabled ? 'Enabled' : 'Disabled'}</b>
        <span style={{ display: 'block' }}>
          This enables the CEF debug protocol for the Steam client. This setting
          must be enabled for Crankshaft to run.
        </span>
        <i>Requires restarting the Steam client to take effect.</i>
      </p>
      <button
        style={{
          width: 75,
          backgroundColor: '#1a9fff',
          textTransform: 'uppercase',
          border: 'none',
          color: 'white',
          borderRadius: 2,
          cursor: 'pointer',
        }}
        onClick={handleToggle}
      >
        {enabled ? 'Disable' : 'Enable'}
      </button>
    </>
  );
};
