import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { Setting } from '.';
import { rpcRequest } from '../../rpc';
import { SMM } from '../../smm';

const useAutostart = (smm: SMM) => {
  const [hasSystemd, setHasSystemd] = useState<boolean | undefined>(undefined);
  const [serviceInstalled, setServiceInstalled] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    (async () => {
      const { getRes } = rpcRequest<{}, { hasSystemd: boolean }>(
        'SystemdService.HostHasSystemd',
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
        'SystemdService.ServiceInstalled',
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
          ? 'SystemdService.InstallService'
          : 'SystemdService.DisableService',
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

  return { hasSystemd, serviceInstalled, setAutostartEnabled };
};

export const Autostart: FunctionComponent<{ smm: SMM }> = ({ smm }) => {
  const { hasSystemd, serviceInstalled, setAutostartEnabled } =
    useAutostart(smm);

  return (
    <>
      <AutostartSection
        hasSystemd={hasSystemd}
        serviceInstalled={serviceInstalled}
        setAutostartEnabled={setAutostartEnabled}
      />
      <RestartSection serviceInstalled={serviceInstalled} smm={smm} />
    </>
  );
};

const RestartSection: FunctionComponent<{
  serviceInstalled?: boolean;
  smm: SMM;
}> = ({ serviceInstalled, smm }) => {
  const [restarting, setRestarting] = useState(false);
  const handleRestart = useCallback(
    () =>
      (async () => {
        setRestarting(true);
        console.log('RESTARTING');

        try {
          await smm.Exec.run('systemctl', [
            '--user',
            'reset-failed',
            'crankshaft.service',
          ]);

          await smm.Exec.run('systemctl', [
            '--user',
            'restart',
            'crankshaft.service',
          ]);
        } catch (err) {
          // TODO: the second request (restart) kills the server, so the
          // request was throwing an error every time
          // smm.Toast.addToast('Error restarting Crankshaft', 'error');
          console.error('Error restarting Crankshaft', err);
        }
      })(),
    [setRestarting]
  );

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  const buttons: JSX.Element[] = [];

  if (serviceInstalled) {
    buttons.push(
      <button
        className="cs-button"
        onClick={handleRestart}
        disabled={restarting}
        style={{ marginRight: 8 }}
        data-cs-gp-in-group="restart"
        data-cs-gp-item="restart__restart-btn"
      >
        {restarting ? 'Restarting Crankshaft...' : 'Restart Crankshaft'}
      </button>
    );
  }

  buttons.push(
    <button
      className="cs-button"
      onClick={handleReload}
      data-cs-gp-in-group="restart"
      data-cs-gp-item="restart__reload-btn"
    >
      Reload Steam
    </button>
  );

  return (
    <Setting name="Restart" gpGroupName="restart">
      <p style={{ margin: '0 0 8px 0' }}>
        {serviceInstalled
          ? 'Restarting Crankshaft or reloading Steam can help debug some issues.'
          : 'Reloading Steam can help debug some issues.'}
      </p>
      <div>{buttons}</div>
    </Setting>
  );
};

const AutostartSection: FunctionComponent<{
  hasSystemd?: boolean;
  serviceInstalled?: boolean;
  setAutostartEnabled: (enabled: boolean) => Promise<void>;
}> = ({ hasSystemd, serviceInstalled, setAutostartEnabled }) => {
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
        <button
          className="cs-button"
          onClick={() => setAutostartEnabled(false)}
          data-cs-gp-in-group="autostart"
          data-cs-gp-item="autostart__autostart-btn"
        >
          Disable
        </button>
      );
    } else {
      text.push(
        <>
          The autostart service is currently <b>disabled</b>.
        </>
      );
      toggleBtn = (
        <button
          className="cs-button"
          onClick={() => setAutostartEnabled(true)}
          data-cs-gp-in-group="autostart"
          data-cs-gp-item="autostart__autostart-btn"
        >
          Enable
        </button>
      );
    }
  }

  return (
    <Setting name="Autostart" gpGroupName="autostart">
      <p style={{ margin: '0 0 8px 0' }}>{text}</p>
      {toggleBtn}
    </Setting>
  );
};
