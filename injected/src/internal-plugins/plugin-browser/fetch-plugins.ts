import {
  Plugin as InstalledPlugin,
  StorePlatforms,
} from '../../services/plugins';
import { SMM } from '../../smm';

const PLUGINS_URL = 'https://crankshaft.space/plugins.json';

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
    platforms: StorePlatforms;
  };

  archive: string;
  sha256: string;

  installedPlugin?: InstalledPlugin;
}

let cachedPlugins: Omit<FetchedPlugin, 'installedPlugin'>[] | undefined;
export const fetchPlugins = async (
  smm: SMM,
  refresh: boolean = false
): Promise<FetchedPlugin[]> => {
  const installedPlugins = await smm.Plugins.list();

  if (!cachedPlugins || refresh) {
    const data = Object.values(
      await smm.Network.get<
        Record<string, Omit<FetchedPlugin, 'installedPlugin'>>
      >(PLUGINS_URL)
    );

    // First filter so only plugins supported by current platform are shown
    cachedPlugins = data
      .filter((plugin) => {
        return plugin.store.platforms[window.csPlatform as keyof StorePlatforms]
          .supported;
      })
      .map((plugin) => ({
        ...plugin,
      }));
  }

  return cachedPlugins.map((plugin) => ({
    ...plugin,
    installedPlugin: installedPlugins[plugin.id],
  }));
};
