import { Service } from './service';

interface AppDetails {
  appId: number;
  name: string;

  // Full properties map from Steam
  _fullDetails: Record<string, any>;
}

export class Apps extends Service {
  /*
	Get app details for an app ID from Steam's cache.
	TODO: get info for uncached app
	TODO: support this from other contexts (IPC probably)
	*/
  getCachedDetailsForApp(appId: number): AppDetails | undefined {
    const appData =
      window.appDetailsStore.m_mapAppData._data.get(appId)?.value.details;
    if (!appData) {
      return undefined;
    }

    return {
      appId,
      name: appData.strDisplayName,
      _fullDetails: JSON.parse(JSON.stringify(appData)),
    };
  }
}
