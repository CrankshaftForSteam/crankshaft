import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { FunctionComponent } from 'preact';
import { memo } from 'preact/compat';
import { useMemo } from 'preact/hooks';
import { Plugin as InstalledPlugin } from '../../services/plugins';
import { SMM } from '../../smm';
import { FetchedPlugin } from './fetch-plugins';
import { useInstallPlugin } from './install-plugin';

const InstallButton = memo<{
  canUpdate?: boolean;
  handleInstall: () => void;
  installedPlugin?: InstalledPlugin;
  plugin: FetchedPlugin;
}>(({ canUpdate, handleInstall, installedPlugin, plugin }) => {
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
});

export const Plugin: FunctionComponent<
  FetchedPlugin & {
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
          <InstallButton
            canUpdate={canUpdate}
            handleInstall={handleInstall}
            installedPlugin={installedPlugin}
            plugin={plugin}
          />
        </div>
        {typeof description !== 'undefined' && Boolean(description) ? (
          <div
            style={{
              borderLeft: 'solid 1px rgba(255, 255, 255, 0.5)',
              paddingLeft: 16,
              flexGrow: 1,
              maxHeight: 200,
              overflow: 'scroll',
            }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        ) : undefined}
      </div>
    </li>
  );
};
