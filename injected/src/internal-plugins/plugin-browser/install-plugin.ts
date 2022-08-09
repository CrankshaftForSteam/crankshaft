import { basename, join } from 'path-browserify';
import { useCallback } from 'preact/hooks';
import {
  NetworkDownloadCancelledError,
  NetworkDownloadTimeoutError,
} from '../../services/network';
import { SMM } from '../../smm';
import { FetchedPlugin } from './fetch-plugins';

const PLUGINS_DIR = '$XDG_DATA/crankshaft/plugins';

export const useInstallPlugin = (
  smm: SMM,
  plugin: FetchedPlugin,
  updatePlugins: () => Promise<void>
) =>
  useCallback(() => {
    (async () => {
      // Ensure plugins directory exists
      await smm.FS.mkDir(PLUGINS_DIR, true);

      const fileName = basename(plugin.archive);

      const progressModal = smm.UI.createProgressModal({
        displayName: `${plugin.name} ${plugin.version}`,
        fileName,
        progress: true,
        title: 'Downloading',
      });

      const { cancel, download, id } = smm.Network.download({
        url: plugin.archive,
        path: join(PLUGINS_DIR, fileName),
        timeoutSeconds: 5 * 60,
        progressCallback: (progress) => {
          progressModal.update(progress);
        },
      });

      progressModal.open(cancel);

      try {
        await download();
      } catch (err) {
        if (err instanceof NetworkDownloadCancelledError) {
          return;
        }
        if (err instanceof NetworkDownloadTimeoutError) {
          smm.Toast.addToast(`Download timed out: ${fileName}`, 'error');
          return;
        }

        smm.Toast.addToast(
          `Error downloading ${plugin.name} ${plugin.version}`,
          'error'
        );
        console.error(`Error downloading ${plugin.name} ${plugin.version}`, {
          plugin,
          err,
        });
        return;
      } finally {
        progressModal.close();
      }

      const extractModal = smm.UI.createProgressModal({
        displayName: `${plugin.name} ${plugin.version}`,
        fileName,
        progress: false,
        title: 'Extracting',
      });

      extractModal.open(() => {
        // TODO: allow cancelling untar
        console.info('Extract cancelled');
        extractModal.close();
      });

      try {
        await smm.FS.untar(join(PLUGINS_DIR, fileName), PLUGINS_DIR).getRes();
      } catch (err) {
        smm.Toast.addToast(`Error extracting ${fileName}`, 'error');
        extractModal.close();
        return;
      } finally {
        // Whether the extraction suceeded or failed, remove the donwload tar file
        smm.FS.removeFile(join(PLUGINS_DIR, fileName));
      }

      extractModal.close();

      try {
        await smm.Plugins.reloadPlugins();
        await smm.Plugins.reloadPlugin(plugin.id);
        await smm.Plugins.setEnabled(plugin.id, true);
      } catch (err) {
        smm.Toast.addToast(`Error loading plugin ${plugin.name}`, 'error');
        console.error(err);
        return;
      }

      updatePlugins();

      smm.Toast.addToast(
        `Plugin ${plugin.name} ${plugin.version} installed!`,
        'success'
      );
    })();
  }, [smm, plugin, updatePlugins]);
