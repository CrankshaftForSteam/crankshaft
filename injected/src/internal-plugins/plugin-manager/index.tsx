import { FunctionComponent, render } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { Plugin } from '../../services/Plugins';
import { SMM } from '../../SMM';

export const load = (smm: SMM) => {
  smm.MenuManager.addMenuItem({
    id: 'manage-plugins',
    label: 'Manage Plugins',
    render: (smm, root) => render(<App smm={smm} />, root),
  });
};

const App: FunctionComponent<{ smm: SMM }> = ({ smm }) => {
  const [plugins, setPlugins] = useState<
    Awaited<ReturnType<typeof smm['Plugins']['list']>> | undefined
  >(undefined);
  useEffect(() => {
    (async () => setPlugins(await smm.Plugins.list()))();
  }, [setPlugins, smm]);

  const reloadPlugins = useCallback(async () => {
    setPlugins(await smm.Plugins.list());
  }, [setPlugins]);

  const handleLoad = useCallback(
    async (pluginId: string) => {
      await smm.Plugins.load(pluginId);
      reloadPlugins();
    },
    [reloadPlugins, smm]
  );

  const handleUnload = useCallback(
    async (pluginId: string) => {
      await smm.Plugins.unload(pluginId);
      reloadPlugins();
    },
    [reloadPlugins, smm]
  );

  return (
    <>
      <h1 style={{ fontSize: 24, margin: 'unset', marginBottom: 16 }}>
        Manage Plugins
      </h1>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {typeof plugins !== 'undefined' ? (
          Object.values(plugins).map((plugin) => (
            <Plugin
              plugin={plugin}
              onLoad={() => handleLoad(plugin.id)}
              onUnload={() => handleUnload(plugin.id)}
            />
          ))
        ) : (
          <p>Loading...</p>
        )}
      </ul>
    </>
  );
};

const Plugin: FunctionComponent<{
  plugin: Plugin;
  onLoad: () => void;
  onUnload: () => void;
}> = ({ plugin, onLoad, onUnload }) => (
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
      <h2 style={{ margin: 0 }}>{plugin.config.name}</h2>
      <p>
        Version {plugin.config.version}
        <br />
        {plugin.enabled ? 'Loaded' : 'Disabled'}
      </p>
      {plugin.enabled ? (
        <cs-button onClick={onUnload}>Unload</cs-button>
      ) : (
        <cs-button onClick={onLoad}>Load</cs-button>
      )}
    </div>
  </li>
);
