import { FunctionComponent, render } from 'preact';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'preact/hooks';
import { Plugin as InstalledPlugin } from '../../services/plugins';
import { SMM } from '../../smm';
import { Plugin } from './plugin';

export const load = (smm: SMM) => {
  smm.MenuManager.addMenuItem({
    id: 'plugin-browser',
    label: 'Get Plugins',
    render: (smm, root) => render(<App smm={smm} />, root),
  });
};

let cachedPlugins: FetchedPlugin[] | undefined;
const fetchPlugins = async (smm: SMM, refresh: boolean = false) => {
  if (cachedPlugins && !refresh) {
    return cachedPlugins;
  }

  const data = await smm.Network.get<Record<string, Omit<FetchedPlugin, 'id'>>>(
    PLUGINS_URL
  );

  cachedPlugins = Object.entries(data).map(([id, plugin]) => ({
    id,
    ...plugin,
  }));

  return cachedPlugins;
};

export interface FetchedPlugin {
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
  const [plugins, setPlugins] = useState<FetchedPlugin[] | undefined>(
    undefined
  );
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
