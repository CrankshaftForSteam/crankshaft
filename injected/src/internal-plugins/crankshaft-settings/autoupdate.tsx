import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { Setting } from '.';
import { rpcRequest } from '../../rpc';
import { SMM } from '../../smm';

const useAutoUpdate = (smm: SMM) => {
  const [hasSystemd, setHasSystemd] = useState<boolean | undefined>(undefined);
  const [serviceInstalled, setServiceInstalled] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    (async () => {
      const { getRes } = rpcRequest<{}, { hasSystemd: boolean }>(
        'AutoUpdateService.HostHasSystemd',
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
        'AutoUpdateService.ServiceInstalled',
        {}
      );
      try {
        const { serviceInstalled } = await getRes();
        setServiceInstalled(serviceInstalled);
      } catch (err) {
        smm.Toast.addToast(
          'Error checking if autoupdate service is installed.',
          'error'
        );
      }
    })();
  }, [hasSystemd, serviceInstalled, setServiceInstalled]);

  const setAutoUpdateEnabled = useCallback(
    async (enabled: boolean) => {
      const { getRes } = rpcRequest<{}, {}>(
        enabled
          ? 'AutoUpdateService.InstallService'
          : 'AutoUpdateService.DisableService',
        {}
      );
      try {
        await getRes();
        setServiceInstalled(enabled);
      } catch (err) {
        smm.Toast.addToast(
          `Error ${enabled ? 'enabling' : 'disabling'} autoupdate service.`,
          'error'
        );
      }
    },
    [hasSystemd, setServiceInstalled]
  );

  return { hasSystemd, serviceInstalled, setAutoUpdateEnabled };
};

export const AutoUpdate: FunctionComponent<{ smm: SMM }> = ({ smm }) => {
  const { hasSystemd, serviceInstalled, setAutoUpdateEnabled } =
    useAutoUpdate(smm);

  return (
    <>
      <AutoUpdateSection
        hasSystemd={hasSystemd}
        serviceInstalled={serviceInstalled}
        setAutoUpdateEnabled={setAutoUpdateEnabled}
      />
    </>
  );
};

const AutoUpdateSection: FunctionComponent<{
  hasSystemd?: boolean;
  serviceInstalled?: boolean;
  setAutoUpdateEnabled: (enabled: boolean) => Promise<void>;
}> = ({ hasSystemd, serviceInstalled, setAutoUpdateEnabled }) => {
  const text = [
    'Crankshaft can be configured to update automatically.',
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
          The autoupdate service is currently <b>enabled</b>.
        </>
      );
      toggleBtn = (
        <button
          className="cs-button"
          onClick={() => setAutoUpdateEnabled(false)}
          data-cs-gp-in-group="autoupdate"
          data-cs-gp-item="autoupdate__autoupdate-btn"
        >
          Disable
        </button>
      );
    } else {
      text.push(
        <>
          The autoupdate service is currently <b>disabled</b>.
        </>
      );
      toggleBtn = (
        <button
          className="cs-button"
          onClick={() => setAutoUpdateEnabled(true)}
          data-cs-gp-in-group="autoupdate"
          data-cs-gp-item="autoupdate__autoupdate-btn"
        >
          Enable
        </button>
      );
    }
  }

  return (
    <Setting name="AutoUpdate" gpGroupName="autoupdate">
      <p style={{ margin: '0 0 8px 0' }}>{text}</p>
      {toggleBtn}
    </Setting>
  );
};
