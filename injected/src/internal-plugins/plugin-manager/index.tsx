import { FunctionComponent, render } from 'preact';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'preact/hooks';
import { Plugin } from '../../services/plugins';
import { SMM } from '../../smm';
import { usePluginActions } from './plugin-actions';

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

  useLayoutEffect(() => {
    smm.activeGamepadHandler?.recalculateTree();
  }, [plugins, smm]);

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
          Object.values(plugins).map((plugin, index) => (
            <Plugin
              plugin={plugin}
              reloadPlugins={reloadPlugins}
              smm={smm}
              first={index === 0}
            />
          ))
        ) : (
          <p
            data-cs-gp-in-group="root"
            data-cs-gp-group="loading"
            data-cs-gp-init-focus
          >
            Loading...
          </p>
        )}
      </ul>
    </>
  );
};

const Plugin: FunctionComponent<{
  first: boolean;
  plugin: Plugin;
  reloadPlugins: () => Promise<void>;
  smm: SMM;
}> = ({ first, plugin, reloadPlugins, smm }) => {
  const { handleLoad, handleUnload, handleReload, handleRemove } =
    usePluginActions({
      plugin,
      reloadPlugins,
      smm,
    });

  return (
    <li
      style={{
        display: 'block',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '8px 0',
        marginBottom: 12,
      }}
      data-cs-gp-in-group="root"
      data-cs-gp-group={plugin.id}
      data-cs-gp-init-focus={first}
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
            <button
              className="cs-button"
              onClick={handleUnload}
              data-cs-gp-in-group={plugin.id}
              data-cs-gp-item={`${plugin.id}__load`}
            >
              Unload
            </button>
          ) : (
            <button
              className="cs-button"
              onClick={handleLoad}
              data-cs-gp-in-group={plugin.id}
              data-cs-gp-item={`${plugin.id}__load`}
            >
              Load
            </button>
          )}

          <button
            className="cs-button"
            onClick={handleReload}
            data-cs-gp-in-group={plugin.id}
            data-cs-gp-item={`${plugin.id}__reload`}
          >
            Reload
          </button>

          <button
            className="cs-button"
            style={{ backgroundColor: 'rgb(209, 28, 28)' }}
            onClick={handleRemove}
            data-cs-gp-in-group={plugin.id}
            data-cs-gp-item={`${plugin.id}__remove`}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
};
