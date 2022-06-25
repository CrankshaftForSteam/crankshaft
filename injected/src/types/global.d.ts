import { SMM } from '../smm';

declare global {
  interface Window {
    smm?: SMM;
    smmTabObserver?: MutationObserver;
    smmServerPort: string;
    smmUIMode: 'desktop' | 'deck';
    csVersion: string;
    smmPlugins: Record<
      string,
      {
        load: (smm: SMM) => void | Promise<void>;
        unload?: (smm: SMM) => void | Promise<void>;
      }
    >;

    csPluginsLoaded?: () => void;

    coolClass: {
      OpenQuickAccessMenu: (tab?: number) => void;

      // 1 = main menu
      // 2 = quick access
      // other/none = close menu
      OpenSideMenu: (menu?: number) => void;
      // Currently open menu (same number values as above)
      m_eOpenSideMenu?: number;

      NavigateToLibraryTab: () => void;
    };

    // Custom menu items to load into the main menu
    csMenuItems?: {
      id: string;
      label: string;
    }[];
    // Force the main menu to re-render
    csMenuUpdate?: () => void;
    // Active custom menu item ID
    csMenuActiveItem?: string;

    // Custom quick access items
    csQuickAccessItems?: {
      id: string;
    }[];
    // Force the quick access menu to re-render
    csQuickAccessUpdate?: () => void;

    csButtonInterceptors?: {
      id: string;
      handler: (buttonCode: number) => void | boolean;
    }[];

    // Internal Steam stuff

    SteamClient: {
      Settings: {
        SetCefRemoteDebuggingEnabled: (value: boolean) => void;
      };
    };

    appDetailsStore: {
      m_mapAppData: {
        _data: Map<
          number,
          {
            key: number;
            value: {
              details: {
                // TODO: finish documenting this
                achievements: {
                  // TODO: finish documenting this
                  nAchieved: number;
                  nTotal: number;
                  // Achieved
                  vecHighlight: {
                    bAchieved: boolean;
                    strID: string;
                    strName: string;
                    strDescription: string;
                    strImage: string;
                    rtUnlocked: number;
                  }[];
                };
                bOverlayEnabled: boolean;
                eAutoUpdateValue: number;
                eBackgroundDownloads: number;
                eCloudSync: number;
                lDiskUsageBytes: number;
                nBuildID: number;
                nPlaytimeForever: number;
                nScreenshots: number;
                rtLastTimePlayed: number;
                rtLastUpdated: number;
                strCompatToolDisplayName: string;
                strCompatToolName: string;
                strDeveloperName: string;
                strDeveloperURL: string;
                strDisplayName: string;
                strFlatpakAppID: string;
                strHomepageURL: string;
                strLaunchOptions: string;
                strOwnerSteamID: string;
                unAppID: number;
                vecDeckCompatTestResults: {
                  test_result: number;
                  test_loc_token: string;
                }[];
                vecLanguages: {
                  strDisplayName: string;
                  strShortName: string;
                }[];
                vecPlatforms: string[];
                vecScreenShots: {
                  bSpoilers: boolean;
                  bUploaded: boolean;
                  ePrivacy: number;
                  hHandle: number;
                  nAppID: number;
                  nCreated: number;
                  nHeight: number;
                  nWidth: number;
                  strCaption: string;
                  strUrl: string;
                }[];
              };
            };
          }
        >;
      };
    };

    settingsStore: {
      m_Settings: {
        bCefRemoteDebuggingEnabled: boolean;
      };
    };

    securitystore: {
      // Show the lock screen
      SetActiveLockScreenProps: (args: {
        onSuccess?: (args: [pin: string]) => void;
      }) => void;
    };

    SystemPowerStore: {
      m_bHasBattery: boolean;
      m_bSayFull: boolean;
      m_bShowingConnectedSlowDetails: boolean;
      m_bShutdownRequested: boolean;
      m_bShuttingDown: boolean;
      m_eACState: number;
      m_eBatteryState: number;
      m_eBatteryTimeConfidence: number;
      m_flBatteryLevel: number;
      m_nBatterySecondsRemaining: number;
    };

    uiStore: {
      m_history: {
        location: Location;
      };
    };
  }
}
