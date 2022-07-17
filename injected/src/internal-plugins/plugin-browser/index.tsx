import { FunctionComponent, render } from 'preact';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'preact/hooks';
import { SMM } from '../../smm';
import { FetchedPlugin, fetchPlugins } from './fetch-plugins';
import { Plugin } from './plugin';

export const load = (smm: SMM) => {
  smm.MenuManager.addMenuItem({
    id: 'plugin-browser',
    label: 'Get Plugins',
    render: (smm, root) => render(<App smm={smm} />, root),
  });
};

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

  useEffect(() => {
    getPlugins();
  }, [getPlugins]);

  const updatePlugins = useCallback(async () => {
    Promise.all([getPlugins()]);
  }, [getPlugins]);

  useLayoutEffect(() => {
    smm.activeGamepadHandler?.recalculateTree();
  }, [smm, plugins]);

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
