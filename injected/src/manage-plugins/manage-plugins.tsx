import { SMM } from '../SMM';

export const load = (smm: SMM) => {
  smm.MenuManager.addMenuItem({
    id: 'manage-plugins',
    label: 'Manage Plugins',
    render,
  });
};

const render = async (smm: SMM) => {
  const plugins = await smm.Plugins.list();

  return (
    <div style={{ padding: '4px 12px' }}>
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
