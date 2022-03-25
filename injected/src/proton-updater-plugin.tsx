import { join } from 'path-browserify';
import { parse } from 'vdf';
import {
  DownloadProgress,
  NetworkDownloadCancelledError,
  NetworkDownloadTimeoutError,
} from './services/Network';
import { SMM } from './SMM';
import { deleteAll, formatBytes, info } from './util';

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

const createProgressModal = ({
  displayName,
  fileName,
  progress = true,
  title = 'Downloading,',
}: {
  displayName: string;
  fileName: string;
  progress: boolean;
  title: string;
}) => {
  deleteAll('[data-smm-proton-updater-progress-modal]');

  const progressText = (
    <h3
      style={{
        margin: 0,
        marginBottom: 8,
      }}
    >
      <span>0%</span>
      <span style={{ color: 'rgba(184, 188, 191, 75%)', marginLeft: 10 }}>
        14 MB / 300 MB
      </span>
    </h3>
  );
  const progressSpan = (
    <span
      style={{
        display: 'block',
        width: '0%',
        height: '100%',
        backgroundColor: '#1a9fff',
        borderRadius: 12,
      }}
    />
  );

  const cancelButton = (
    <button
      style={{
        backgroundColor: '#1a9fff',
        textTransform: 'uppercase',
        border: 'none',
        borderRadius: 2,
        color: 'white',
        cursor: 'pointer',
        alignSelf: 'flex-end',
        fontSize: 16,
        padding: '4px 12px',
        marginTop: 12,
      }}
    >
      Cancel
    </button>
  );

  const modal = (
    <div
      data-smm-modal={true}
      data-smm-proton-updater-progress-modal={true}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 'auto',
        zIndex: 9999,

        height: 'min-content',
        maxWidth: '40%',

        display: 'flex !important',
        flexDirection: 'column',
        justifyContent: 'space-between',

        backgroundColor: '#23262e',
        borderRadius: 8,
        boxShadow: '-12px 18px 24px -12px rgba(0, 0, 0, 0.5)',
        color: '#b8bcbf',
        padding: 20,
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        {title} {displayName}...
      </h2>
      {progress ? (
        <>
          {progressText}
          <div
            style={{
              height: 12,
              backgroundColor: 'rgba(255, 255, 255, 10%)',
              borderRadius: 12,
            }}
          >
            {progressSpan}
          </div>
        </>
      ) : null}
      {cancelButton}
    </div>
  );

  return {
    open: (cancel: () => void) => {
      modal.style.display = '';
      cancelButton.onclick = () => {
        cancel();
        modal.remove();
      };
      document.querySelector('body')?.appendChild(modal);
    },
    update: ({
      progressPercent,
      progressBytes,
      finalSizeBytes,
    }: DownloadProgress) => {
      const progress = `${progressPercent}%`;
      progressText.children[0].textContent = progress;
      progressText.children[1].textContent = `${formatBytes(
        progressBytes
      )} / ${formatBytes(finalSizeBytes)}`;
      progressSpan.style.width = progress;
    },
    close: () => modal.remove(),
  };
};

export const loadProtonUpdaterPlugin = (smm: SMM) => {
  deleteAll('[data-smm-proton-updater-modal]');
  deleteAll('[data-smm-proton-updater-progress-modal]');

  const handleMenuItemClick = async () => {
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
            z-index: 999;

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
            cursor: pointer;
          }
          .smm-proton-updater-modal > button.smm-proton-updater-modal-close:focus {
            outline: none;
          }
          .smm-proton-updater-modal > button.smm-proton-updater-modal-close:focus-visible {
            outline: inherit;
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
            margin-bottom: 8px;
          }

          .smm-proton-updater-version-list {
            height: 100%;
            margin-top: 0;
            margin-bottom: 48px;
            padding: 0;
            overflow-y: scroll;

            list-style: none;
            background-color: rgba(0, 0, 0, 25%);
            border: solid 4px #1e2732;
            border-radius: 8px;
            box-shadow: 0px 8px 12px 0px rgb(0 0 0 / 5%);
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
          .smm-proton-updater-version-list > li > button:focus {
            outline: none;
          }
          .smm-proton-updater-version-list > li > button:focus-visible {
            outline: inherit;
          }

          div[data-smm-modal][data-smm-proton-updater-progress-modal] {
            display: flex;
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
        data-smm-modal={true}
        data-smm-proton-updater-modal={true}
        className="smm-proton-updater-modal"
      >
        <button
          onClick={handleClose}
          className="smm-proton-updater-modal-close"
        >
          x
        </button>
        <h1>Compatibility Tools Manager</h1>
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
          info(
            'found asset:',
            release.assets.find(
              (asset) => asset.content_type === 'application/gzip'
            )
          );
          const { name, browser_download_url } = release.assets.find(
            (asset) => asset.content_type === 'application/gzip'
          )!;

          const progressModal = createProgressModal({
            displayName: release.tag_name,
            fileName: name,
            progress: true,
            title: 'Downloading',
          });

          const { cancel, download, id } = smm.Network.download({
            url: browser_download_url,
            path: join(COMPAT_TOOLS_DIR, name),
            timeoutSeconds: 5 * 60,
            progressCallback: (progress) => {
              progressModal.update(progress);
            },
          });

          progressModal.open(cancel);

          try {
            console.info('Start downloading', { name, browser_download_url });
            await download();
          } catch (err) {
            if (err instanceof NetworkDownloadCancelledError) {
              smm.Toast.addToast(`${release.tag_name} download cancelled.`);
              return;
            }
            if (err instanceof NetworkDownloadTimeoutError) {
              smm.Toast.addToast(`${release.tag_name} download timed out.`);
              return;
            }

            smm.Toast.addToast(
              `Error downloading Proton-GE ${release.tag_name}`
            );
            console.error('Error downloading Proton-GE', release, err);
            return;
          }

          progressModal.close();

          console.info('Done downloading', { name, browser_download_url });

          const extractModal = createProgressModal({
            displayName: release.tag_name,
            fileName: name,
            progress: false,
            title: 'Extracting',
          });

          // TODO: allow cancelling untar
          extractModal.open(() => info('Cancelled'));

          try {
            console.info('Untarring', { name });
            await smm.FS.untar(
              join(COMPAT_TOOLS_DIR, name),
              COMPAT_TOOLS_DIR
            ).getRes();
            console.info('Done untarring', { name });
          } catch (err) {
            smm.Toast.addToast(
              `Error extracting Proton-GE ${release.tag_name}`
            );
            console.error('Error extracting Proton-GE', release, err);
            return;
          }

          extractModal.close();

          smm.Toast.addToast(`${release.tag_name} installed!`, 'success');

          handleClose();
          handleMenuItemClick();
        };

        availableVersionsList.appendChild(
          <li>
            <span>{release.tag_name}</span>
            <button onClick={handleInstall}>Install</button>
          </li>
        );
      });
  };

  smm.MenuManager.addMenuItem(
    {
      id: 'proton-updater',
      label:
        window.smmUIMode === 'deck'
          ? 'Compatibility Tools'
          : 'Compatibility Tools Manager',
      fontSize: 16,
    },
    handleMenuItemClick
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
      info({ toolDir });
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
