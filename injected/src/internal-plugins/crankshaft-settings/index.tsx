import { FunctionComponent, render } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { rpcRequest } from '../../rpc';
import { SMM } from '../../SMM';

export const load = (smm: SMM) => {
  smm.MenuManager.addMenuItem({
    id: 'crankshaft-settings',
    label: 'Crankshaft Settings',
    render: (smm, root) => render(<App smm={smm} />, root),
  });
};

const App: FunctionComponent<{ smm: SMM }> = ({ smm }) => (
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
      <Autostart smm={smm} />
      <Devtools smm={smm} />
      <CefDebugToggle />
    </ul>
  </>
);

const Setting: FunctionComponent<{ name: string }> = ({ name, children }) => (
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
      <h2 style={{ margin: 0 }}>{name}</h2>
      {children}
    </div>
  </li>
);

const Autostart: FunctionComponent<{ smm: SMM }> = ({ smm }) => {
  const [hasSystemd, setHasSystemd] = useState<boolean | undefined>(undefined);
  const [serviceInstalled, setServiceInstalled] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    (async () => {
      const { getRes } = rpcRequest<{}, { hasSystemd: boolean }>(
        'AutostartService.HostHasSystemd',
        {}
      );
      try {
        const { hasSystemd } = await getRes();
        setHasSystemd(hasSystemd);
      } catch (err) {
        smm.Toast.addToast('Error checking if host has Systemd.', 'error');
      }
    })();
  }, [setHasSystemd]);

  useEffect(() => {
    (async () => {
      if (
        typeof hasSystemd === 'undefined' ||
        typeof serviceInstalled !== 'undefined'
      ) {
        return;
      }

      const { getRes } = rpcRequest<{}, { serviceInstalled: boolean }>(
        'AutostartService.ServiceInstalled',
        {}
      );
      try {
        const { serviceInstalled } = await getRes();
        setServiceInstalled(serviceInstalled);
      } catch (err) {
        smm.Toast.addToast(
          'Error checking if autostart service is installed.',
          'error'
        );
      }
    })();
  }, [hasSystemd, serviceInstalled, setServiceInstalled]);

  const setAutostartEnabled = useCallback(
    async (enabled: boolean) => {
      const { getRes } = rpcRequest<{}, {}>(
        enabled
          ? 'AutostartService.InstallService'
          : 'AutostartService.DisableService',
        {}
      );
      try {
        await getRes();
        setServiceInstalled(enabled);
      } catch (err) {
        smm.Toast.addToast(
          `Error ${enabled ? 'enabling' : 'disabling'} autostart service.`,
          'error'
        );
      }
    },
    [hasSystemd, setServiceInstalled]
  );

  const text = [
    'Crankshaft can be configured to start automatically with your system.',
    <br />,
  ];
  let toggleBtn: JSX.Element | null = null;

  if (
    typeof hasSystemd === 'undefined' ||
    typeof serviceInstalled === 'undefined'
  ) {
    text.push('Loading...');
  } else {
    if (serviceInstalled) {
      text.push(
        <>
          The autostart service is currently <b>enabled</b>.
        </>
      );
      toggleBtn = (
        <cs-button onClick={() => setAutostartEnabled(false)}>
          Disable
        </cs-button>
      );
    } else {
      text.push(
        <>
          The autostart service is currently <b>disabled</b>.
        </>
      );
      toggleBtn = (
        <cs-button onClick={() => setAutostartEnabled(true)}>Enable</cs-button>
      );
    }
  }

  return (
    <Setting name="Autostart">
      <p style={{ margin: '4px 0 4px' }}>{text}</p>
      {toggleBtn}
    </Setting>
  );
};

const Devtools: FunctionComponent<{ smm: SMM }> = ({ smm }) => {
  const [devtoolsFrontendUrl, setDevtoolsFrontendUrl] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    (async () => {
      const targets = await smm.Network.get<
        {
          title: string;
          devtoolsFrontendUrl: string;
        }[]
      >('http://localhost:8080/json');

      const libraryTarget = targets.find((t) => t.title === 'SP');
      if (libraryTarget) {
        setDevtoolsFrontendUrl(
          'devtools://devtools/bundled/inspector.html?experiments=true&' +
            libraryTarget.devtoolsFrontendUrl.replace(
              `/devtools/inspector.html?`,
              ''
            )
        );
      }
    })();
  }, [setDevtoolsFrontendUrl, smm]);

  return (
    <Setting name="Open Chrome devtools">
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
    </Setting>
  );
};

const CefDebugToggle: FunctionComponent = () => {
  const [enabled, setEnabled] = useState(
    window.settingsStore.m_Settings.bCefRemoteDebuggingEnabled
  );

  const handleToggle = useCallback(() => {
    window.SteamClient.Settings.SetCefRemoteDebuggingEnabled(!enabled);
    setEnabled((prev) => !prev);
  }, [enabled, setEnabled]);

  return (
    <Setting name="Steam Client CEF debugging">
      <>
        <p style={{ margin: '0 0 8px 0' }}>
          <b>{enabled ? 'Enabled' : 'Disabled'}</b>
          <span style={{ display: 'block' }}>
            This enables the CEF debug protocol for the Steam client. This
            setting must be enabled for Crankshaft to run.
          </span>
          <i>Requires restarting the Steam client to take effect.</i>
        </p>
        <cs-button onClick={handleToggle}>
          {enabled ? 'Disable' : 'Enable'}
        </cs-button>
      </>
    </Setting>
  );
};
