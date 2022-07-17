import { Plugin as InstalledPlugin } from '../../services/plugins';
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
  };

  archive: string;
  sha256: string;

  installedPlugin?: InstalledPlugin;
}

let cachedPlugins: FetchedPlugin[] | undefined;
export const fetchPlugins = async (smm: SMM, refresh: boolean = false) => {
  if (!cachedPlugins || refresh) {
    const data = Object.values(
      await smm.Network.get<
        Record<string, Omit<FetchedPlugin, 'installedPlugin'>>
      >(PLUGINS_URL)
    );

    const installedPlugins = await smm.Plugins.list();

    cachedPlugins = data.map((plugin) => ({
      ...plugin,
      installedPlugin: installedPlugins[plugin.id],
    }));
  }

  return cachedPlugins;
};
