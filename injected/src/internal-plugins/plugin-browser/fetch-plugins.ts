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
}

let cachedPlugins: FetchedPlugin[] | undefined;
export const fetchPlugins = async (smm: SMM, refresh: boolean = false) => {
  if (!cachedPlugins || refresh) {
    cachedPlugins = Object.values(
      await smm.Network.get<Record<string, FetchedPlugin>>(PLUGINS_URL)
    );
  }

  return cachedPlugins;
};
