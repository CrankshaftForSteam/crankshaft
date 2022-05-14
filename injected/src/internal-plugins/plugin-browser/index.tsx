import { FunctionComponent, render } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { Plugin as InstalledPlugin } from '../../services/Plugins';
import { SMM } from '../../SMM';
import { useInstallPlugin } from './install-plugin';

export const load = (smm: SMM) => {
  smm.MenuManager.addMenuItem({
    id: 'plugin-browser',
    label: 'Get Plugins',
    render: (smm, root) => render(<App smm={smm} />, root),
  });
};

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  source: string;
  archive: string;
  sha256: string;
}

const PLUGINS_URL =
  'https://git.sr.ht/~avery/crankshaft-plugins/blob/main/plugins.json';

const App: FunctionComponent<{ smm: SMM }> = ({ smm }) => {
  const [plugins, setPlugins] = useState<Plugin[] | undefined>(undefined);
  const getPlugins = useCallback(async () => {
    const data = await smm.Network.get<{ plugins: Plugin[] }>(PLUGINS_URL);
    setPlugins(data.plugins);
  }, [setPlugins, smm]);

  const [installedPlugins, setInstalledPlugins] = useState<
    Record<string, InstalledPlugin> | undefined
  >(undefined);
  const getInstalledPlugins = useCallback(async () => {
    setInstalledPlugins(await smm.Plugins.list());
  }, [setInstalledPlugins, smm]);

  useEffect(() => {
    getPlugins();
    getInstalledPlugins();
  }, [getPlugins, getInstalledPlugins]);

  const updatePlugins = useCallback(async () => {
    Promise.all([getPlugins(), getInstalledPlugins()]);
  }, [getPlugins, getInstalledPlugins]);

  return (
    <>
      <h1 style={{ fontSize: 24, margin: 'unset', marginBottom: 16 }}>
        Get Plugins
      </h1>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {plugins
          ? plugins.map((plugin) => (
              <Plugin
                {...plugin}
                installedPlugin={installedPlugins?.[plugin.id]}
                smm={smm}
                updatePlugins={updatePlugins}
                key={plugin.id}
              />
            ))
          : 'Loading...'}
      </ul>
    </>
  );
};

const Plugin: FunctionComponent<
  Plugin & {
    smm: SMM;
    installedPlugin?: InstalledPlugin;
    updatePlugins: () => Promise<void>;
  }
> = ({ smm, installedPlugin, updatePlugins, ...plugin }) => {
  const handleInstall = useInstallPlugin(smm, plugin, updatePlugins);

  const canUpdate = useMemo(
    () => installedPlugin && plugin.version > installedPlugin.config.version,
    [installedPlugin, plugin]
  );

  return (
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
          margin: '0 12px',
        }}
      >
        <h2 style={{ margin: 0 }}>{plugin.name}</h2>
        <p>
          by {plugin.author}
          <br />
          Version {plugin.version}
          <br />
          <a href={plugin.source}>Source code</a>
          <br />
          {installedPlugin ? (
            <>Currently installed version: {installedPlugin.config.version}</>
          ) : (
            <>Available version: ${plugin.version}</>
          )}
        </p>
        {installedPlugin ? (
          canUpdate ? (
            <cs-button onClick={handleInstall}>Update</cs-button>
          ) : (
            <cs-button disabled>Already Installed</cs-button>
          )
        ) : (
          <cs-button onClick={handleInstall}>Install</cs-button>
        )}
      </div>
    </li>
  );
};