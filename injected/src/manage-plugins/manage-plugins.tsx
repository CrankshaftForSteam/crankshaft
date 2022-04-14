import { SMM } from '../SMM';

export const load = (smm: SMM) => {
  smm.MenuManager.addMenuItem({
    id: 'manage-plugins',
    label: 'Manage Plugins',
    render: showPlugin,
  });
};

const showPlugin = async (smm: SMM) => {
  const container = <div style={{ padding: '4px 12px' }} />;

  const render = async () => {
    const plugins = await smm.Plugins.list();

    const contents = (
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
          {plugins.map((plugin) => (
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
                <span>{plugin.enabled ? 'Loaded' : 'Disabled'}</span>
                {plugin.enabled ? (
                  <button
                    style={{
                      width: 75,
                      backgroundColor: '#1a9fff',
                      textTransform: 'uppercase',
                      border: 'none',
                      color: 'white',
                      borderRadius: 2,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      smm.Plugins.unload(plugin.id);
                      setTimeout(render, 50);
                    }}
                  >
                    Unload
                  </button>
                ) : (
                  <button
                    style={{
                      width: 75,
                      backgroundColor: '#1a9fff',
                      textTransform: 'uppercase',
                      border: 'none',
                      color: 'white',
                      borderRadius: 2,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      smm.Plugins.load(plugin.id);
                      setTimeout(render, 50);
                    }}
                  >
                    Load
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </>
    );

    container.innerHTML = '';
    container.appendChild(contents);
  };

  render();

  return container;
};
