import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { FunctionComponent, render } from 'preact';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'preact/hooks';
import { Plugin as InstalledPlugin } from '../../services/plugins';
import { SMM } from '../../smm';
import { useInstallPlugin } from './install-plugin';

export const load = (smm: SMM) => {
  smm.MenuManager.addMenuItem({
    id: 'plugin-browser',
    label: 'Get Plugins',
    render: (smm, root) => render(<App smm={smm} />, root),
  });
};

let cachedPlugins: Plugin[] | undefined;
const fetchPlugins = async (smm: SMM, refresh: boolean = false) => {
  if (cachedPlugins && !refresh) {
    return cachedPlugins;
  }

  const data = await smm.Network.get<Record<string, Omit<Plugin, 'id'>>>(
    PLUGINS_URL
  );

  cachedPlugins = Object.entries(data).map(([id, plugin]) => ({
    id,
    ...plugin,
  }));

  return cachedPlugins;
};

export interface Plugin {
  id: string;

  name: string;
  version: string;
  link: string;
  source: string;
  minCrankshaftVersion?: string;

  author: {
    name: string;
    link?: string;
  };

  store: {
    description?: string;
  };

  archive: string;
  sha256: string;
}

const PLUGINS_URL = 'https://crankshaft.space/plugins.json';

const App: FunctionComponent<{ smm: SMM }> = ({ smm }) => {
  const [plugins, setPlugins] = useState<Plugin[] | undefined>(undefined);
  const getPlugins = useCallback(
    async (refresh: boolean = false) => {
      setPlugins(undefined);
      setPlugins(await fetchPlugins(smm, refresh));
    },
    [setPlugins, smm]
  );

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

  useLayoutEffect(() => {
    smm.activeGamepadHandler?.recalculateTree();
  }, [smm, plugins, installedPlugins]);

  return (
    <>
      <div style={{ display: 'flex', marginBottom: 16, gap: 16 }}>
        <h1 style={{ fontSize: 24, margin: 'unset' }}>Get Plugins</h1>
        <button className="cs-button" onClick={() => getPlugins(true)}>
          Refresh
        </button>
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {plugins ? (
          plugins.map((plugin, index) => (
            <Plugin
              {...plugin}
              first={index === 0}
              installedPlugin={installedPlugins?.[plugin.id]}
              smm={smm}
              updatePlugins={updatePlugins}
              key={plugin.id}
            />
          ))
        ) : (
          <div
            data-cs-gp-in-group="root"
            data-cs-gp-group="loading"
            data-cs-gp-init-focus
          >
            Loading...
          </div>
        )}
      </ul>
    </>
  );
};

const Plugin: FunctionComponent<
  Plugin & {
    first: boolean;
    smm: SMM;
    installedPlugin?: InstalledPlugin;
    updatePlugins: () => Promise<void>;
  }
> = ({ first, smm, installedPlugin, updatePlugins, ...plugin }) => {
  const handleInstall = useInstallPlugin(smm, plugin, updatePlugins);

  const canUpdate = useMemo(
    () => installedPlugin && plugin.version > installedPlugin.config.version,
    [installedPlugin, plugin]
  );

  const installButton = useMemo(() => {
    if (canUpdate) {
      if (
        plugin.minCrankshaftVersion &&
        plugin.minCrankshaftVersion > window.csVersion
      ) {
        return (
          <button className="cs-button" disabled>
            Update Crankshaft to update this plugin
          </button>
        );
      }
      return (
        <button
          className="cs-button"
          onClick={handleInstall}
          data-cs-gp-in-group={plugin.id}
          data-cs-gp-item={`${plugin.id}__install`}
        >
          Update
        </button>
      );
    }

    if (Boolean(installedPlugin)) {
      return (
        <button className="cs-button" disabled>
          Already installed
        </button>
      );
    }

    if (
      plugin.minCrankshaftVersion &&
      plugin.minCrankshaftVersion > window.csVersion
    ) {
      return (
        <button className="cs-button" disabled>
          Update Crankshaft to install this plugin
        </button>
      );
    }

    return (
      <button
        className="cs-button"
        onClick={handleInstall}
        data-cs-gp-in-group={plugin.id}
        data-cs-gp-item={`${plugin.id}__install`}
      >
        Install
      </button>
    );
  }, [installedPlugin, plugin, canUpdate]);

  const description = useMemo(() => {
    if (!plugin.store.description) {
      return undefined;
    }

    return DOMPurify.sanitize(marked.parse(plugin.store.description));
  }, [plugin.store.description]);

  return (
    <li
      style={{
        display: 'block',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '8px 0',
        marginBottom: 12,
      }}
      data-cs-gp-init-focus={first}
      data-cs-gp-in-group="root"
      data-cs-gp-group={plugin.id}
    >
      <h2 style={{ margin: '0 0 0 12px' }}>{plugin.name}</h2>
      <div
        style={{
          display: 'flex',
          margin: '0 12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginRight: 16,
            flex: '0 0 166px',
          }}
        >
          <p style={{ marginTop: 0 }}>
            by {plugin.author.name}
            <br />
            Version {plugin.version}
            <br />
            <a
              href={plugin.source}
              data-cs-gp-in-group={plugin.id}
              data-cs-gp-item={`${plugin.id}__source-code`}
            >
              Source code
            </a>
            <br />
            {installedPlugin && canUpdate ? (
              <>Latest version: {plugin.version}</>
            ) : null}
          </p>
          {installButton}{' '}
        </div>
        {typeof description !== 'undefined' && Boolean(description) ? (
          <div
            style={{
              borderLeft: 'solid 1px rgba(255, 255, 255, 0.5)',
              paddingLeft: 16,
              flexGrow: 1,
            }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        ) : undefined}
      </div>
    </li>
  );
};
