import { SMM } from '../../smm';
import { fetchPlugins } from './fetch-plugins';

const HOUR = 1000 * 60 * 60;
const pluginId = '_cs-plugin-browser';

export const checkForUpdates = async (smm: SMM) => {
  let lastUpdateCheck: Date | undefined;
  const lastUpdateCheckString = await smm.Store.get(
    pluginId,
    'lastUpdateCheck'
  );
  if (lastUpdateCheckString) {
    lastUpdateCheck = new Date(Number(lastUpdateCheckString));
  }

  if (
    !lastUpdateCheck ||
    Math.abs(new Date().getTime() - lastUpdateCheck.getTime()) / HOUR >= 24
  ) {
    console.log('Checking for plugin updates...');

    const plugins = await fetchPlugins(smm);

    // Show toast if any plugins have updates available
    if (
      plugins.some(
        ({ installedPlugin, ...plugin }) =>
          installedPlugin && plugin.version > installedPlugin.config.version
      )
    ) {
      smm.Toast.addToast(
        'Plugin updates are available! Check the plugin store to download updates.',
        'success',
        {
          timeout: 5000,
        }
      );
    }

    await smm.Store.set(
      pluginId,
      'lastUpdateCheck',
      String(new Date().getTime())
    );
  }
};
