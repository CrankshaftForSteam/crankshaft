import { FunctionComponent, render } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { Plugin } from '../../services/Plugins';
import { ConfirmModalCancelledError } from '../../services/ui/confirm-modal';
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
              reloadPlugins={reloadPlugins}
              smm={smm}
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
  reloadPlugins: () => Promise<void>;
  smm: SMM;
}> = ({ plugin, onLoad, onUnload, reloadPlugins, smm }) => {
  const handleRemove = useCallback(async () => {
    try {
      await smm.UI.confirm({
        message: `Are you sure you want to remove the plugin ${plugin.config.name}?`,
        confirmText: 'Remove plugin',
        confirmBackgroundColour: 'rgb(209, 28, 28)',
      });
      await smm.Plugins.remove(plugin.id);
      smm.Toast.addToast(`Plugin ${plugin.config.name} removed`, 'success');
    } catch (err) {
      if (err instanceof ConfirmModalCancelledError) {
        return;
      }

      console.error(err);
      smm.Toast.addToast('Error removing plugin.', 'error');
    } finally {
      reloadPlugins();
    }
  }, [smm]);

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
        <h2 style={{ margin: 0 }}>{plugin.config.name}</h2>
        <p style={{ marginTop: 0 }}>
          Version {plugin.config.version}
          <br />
          {plugin.enabled ? 'Loaded' : 'Disabled'}
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          {plugin.enabled ? (
            <button className="cs-button" onClick={onUnload}>
              Unload
            </button>
          ) : (
            <button className="cs-button" onClick={onLoad}>
              Load
            </button>
          )}

          <button
            className="cs-button"
            style={{ backgroundColor: 'rgb(209, 28, 28)' }}
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
};
