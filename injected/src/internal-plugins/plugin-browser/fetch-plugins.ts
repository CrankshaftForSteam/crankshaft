import {Plugin as InstalledPlugin} from '../../services/plugins';
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
    linux: boolean;
    windows: boolean;
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

    cachedPlugins = data.map((plugin) => ({
      ...plugin,
    }));
  }

  return cachedPlugins.map((plugin) => ({
    ...plugin,
    installedPlugin: installedPlugins[plugin.id],
  }));
};
