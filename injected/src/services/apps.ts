import { Service } from './service';

interface AppDetails {
  appId: number;
  name: string;

  // Full properties map from Steam
  _fullDetails: Record<string, any>;
}

enum ipcNames {
  getCachedDetailsForApp = 'csAppsGetCachedDetailsForApp',
  getCachedDetailsForAppRes = 'csAppsGetCachedDetailsForAppRes',
}

export class Apps extends Service {
  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);

    if (this.smm.entry === 'library') {
      this.smm.IPC.on<{ appId: number }>(
        ipcNames.getCachedDetailsForApp,
        async ({ data: { appId } }) => {
          this.smm.IPC.send<AppDetails | undefined>(
            ipcNames.getCachedDetailsForAppRes,
            await this.getCachedDetailsForApp(appId)
          );
        }
      );
    }
  }

  /*
  Get app details for an app ID from Steam's cache.
  TODO: get info for uncached app
  TODO: support this from other contexts (IPC probably)
  */
  async getCachedDetailsForApp(appId: number): Promise<AppDetails | undefined> {
    if (this.smm.entry !== 'library') {
      this.smm.IPC.send<{ appId: number }>(ipcNames.getCachedDetailsForApp, {
        appId,
      });
      const appDetails = await new Promise<AppDetails | undefined>(
        (resolve) => {
          this.smm.IPC.on<AppDetails | undefined>(
            ipcNames.getCachedDetailsForAppRes,
            ({ data }) => {
              resolve(data);
              this.smm.IPC.off(ipcNames.getCachedDetailsForAppRes);
            }
          );
        }
      );
      return appDetails;
    }

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
