import { join } from 'path-browserify';
import { parse } from 'vdf';
import { SMM } from './SMM';
import { deleteAll } from './util';

interface Release {
  tag_name: string;
  published_at: string;
  prerelease: boolean;
  html_url: string;
  assets: {
    content_type: string;
    browser_download_url: string;
    name: string;
  }[];
}

const COMPAT_TOOLS_DIR = '~/.steam/steam/compatibilitytools.d/';

let releasesCache: Release[];

export const loadProtonUpdaterPlugin = (smm: SMM) => {
  deleteAll('[data-smm-proton-updater-modal]');

  smm.MenuManager.addMenuItem(
    {
      id: 'proton-updater',
      label: 'Compatibility Tools',
      icon: 'settings',
      fontSize: 16,
    },
    async () => {
      const handleClose = () => {
        deleteAll('[data-smm-proton-updater-modal]');
        deleteAll('[data-smm-proton-updater-style]');
        document.removeEventListener('click', handleClose);
      };

      // Close when clicked outside the modal
      document.addEventListener('click', (event) => {
        if (
          !(event.target as HTMLElement)?.closest(
            '[data-smm-proton-updater-modal]'
          )
        ) {
          handleClose();
        }
      });

      const style = (
        <style data-smm-proton-updater-style>{`
          .smm-proton-updater-modal {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            margin: auto;

            display: flex;
            flex-direction: column;

            maxWidth: 600px;
            maxHeight: 500px;
            width: 80%;
            height: 80%;
            padding: 4px 12px;

            background-color: #23262e;
            border-radius: 8px;
            box-shadow: -12px 18px 24px -12px rgba(0, 0, 0, 0.5);
            color: #b8bcbf;
          }

          .smm-proton-updater-modal > button.smm-proton-updater-modal-close {
            position: absolute;
            top: 0;
            right: 8px;

            border: none;
            background: none;
            color: rgba(255, 255, 255, 50%);
            font-size: 20px;
            font-weight: 600;
          }

          .smm-proton-updater-container {
            display: flex;
            flex-direction: row;
            height: 100%;
          }

          .smm-proton-updater-container > div {
            width: 50%;
            height: 100%;
            display: flex;
            flex-direction: column;
          }

          .smm-proton-updater-modal h1 {
            margin: unset;
            font-size: 24px;
          }

          .smm-proton-updater-modal h2 {
            font-size: 16px;
          }

          .smm-proton-updater-version-list {
            height: 100%;
            margin-top: 0;
            margin-bottom: 48px;
            padding: 0;
            overflow-y: scroll;

            list-style: none;
            background-color: rgba(0, 0, 0, 25%);
            border: solid 1px white;
            border-radius: 8px;
          }

          .smm-proton-updater-version-list > li {
            display: flex;
            justify-content: space-between;

            padding: 4px 8px;
            transition: all 300ms;
          }

          .smm-proton-updater-version-list > li:hover {
            background-color: rgba(255, 255, 255, 10%);
          }

          .smm-proton-updater-version-list > li:hover> button {
            display: unset;
          }

          .smm-proton-updater-version-list > li > button {
            display: none;

            background-color: #1a9fff;
            text-transform: uppercase;
            border: none;
            color: white;
            border-radius: 2px;
            cursor: pointer;
          }
      `}</style>
      );
      deleteAll('[data-smm-proton-updater-style]');
      document.querySelector('head')?.appendChild(style);

      const installedVersionsList = (
        <ul className="smm-proton-updater-version-list" />
      );

      const availableVersionsList = (
        <ul className="smm-proton-updater-version-list" />
      );

      const modal = (
        <div
          data-smm-proton-updater-modal={true}
          className="smm-proton-updater-modal"
        >
          <button
            onClick={handleClose}
            className="smm-proton-updater-modal-close"
          >
            x
          </button>
          <h1>Compatibility Tools</h1>
          <div className="smm-proton-updater-container">
            <div
              style={{
                marginRight: 8,
              }}
            >
              <h2>Installed versions</h2>
              {installedVersionsList}
            </div>
            <div
              style={{
                marginLeft: 8,
              }}
            >
              <h2>Available versions</h2>
              {availableVersionsList}
            </div>
          </div>
        </div>
      );
      document.querySelector('body')?.appendChild(modal);

      const installedTools = await getInstalledTools(smm);
      installedTools
        .sort((a, b) =>
          a.version < b.version ? 1 : a.version > b.version ? -1 : 0
        )
        .forEach((tool) => {
          const item = <li>{tool.version}</li>;
          installedVersionsList.appendChild(item);
        });

      const releases =
        releasesCache ??
        (await smm.Network.get<Release[]>(
          'https://api.github.com/repos/GloriousEggroll/proton-ge-custom/releases'
        ));
      releasesCache = releases;

      const installedToolVersions = installedTools.map((tool) => tool.version);
      releases
        .filter((release) => !installedToolVersions.includes(release.tag_name))
        .forEach((release) => {
          const handleInstall = async () => {
            // Find downalod
            const { name, browser_download_url } = release.assets.find(
              (asset) => asset.content_type === 'application/gzip'
            )!;
            try {
              console.info('Start downloading', { name, browser_download_url });
              await smm.Network.download(
                browser_download_url,
                join(COMPAT_TOOLS_DIR, name)
              );
              console.info('Done downloading', { name, browser_download_url });
            } catch (err) {
              smm.Toast.addToast(
                `Error downloading Proton-GE ${release.tag_name}`
              );
              console.error('Error downloading Proton-GE', release, err);
              return;
            }

            try {
              console.info('Untarring', { name });
              await smm.FS.untar(
                join(COMPAT_TOOLS_DIR, name),
                COMPAT_TOOLS_DIR
              );
              console.info('Done untarring', { name });
            } catch (err) {
              smm.Toast.addToast(
                `Error extracting Proton-GE ${release.tag_name}`
              );
              console.error('Error extracting Proton-GE', release, err);
              return;
            }
          };

          availableVersionsList.appendChild(
            <li>
              <span>{release.tag_name}</span>
              <button onClick={handleInstall}>Install</button>
            </li>
          );
        });
    }
  );
};

interface ToolInfo {
  compatibilitytools: {
    compat_tools: {
      [key: string]: {
        display_name: string;
        from_oslist: string;
        install_path: string;
        to_oslist: string;
      };
    };
  };
}

const getInstalledTools = async (smm: SMM) => {
  const dirs = (await smm.FS.listDir(COMPAT_TOOLS_DIR)).filter(
    (dir) => dir.isDir
  );
  return Promise.all(
    dirs.map(async (toolDir) => {
      const version = (
        await smm.FS.readFile(join(COMPAT_TOOLS_DIR, toolDir.name, 'version'))
      ).split(' ')[1];

      const toolInfo = parse<ToolInfo>(
        await smm.FS.readFile(
          join(COMPAT_TOOLS_DIR, toolDir.name, 'compatibilitytool.vdf')
        )
      );

      const displayName = Object.keys(
        toolInfo.compatibilitytools['compat_tools']
      )[0];

      return {
        version,
        displayName,
      };
    })
  );
};
