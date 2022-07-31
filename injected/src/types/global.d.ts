import type { SMM } from '../smm';

export interface AppPropsApp {
  app_type: number;
  appid: number;
  association: string[];
  canonicalAppType: number;
  controller_support: number;
  display_name: string;
  metacritic_score: number;
  minutes_playtime_forever: number;
  minutes_playtime_last_two_weeks: number;
  review_percentage_with_bombs: number;
  review_percentage_without_bombs: number;
  review_score_with_bombs: number;
  review_score_without_bombs: number;
  rt_last_time_locally_played: number;
  rt_last_time_played: number;
  rt_last_time_played_or_installed: number;
  rt_original_release_date: number;
  rt_purchased_time: number;
  rt_recent_activity_time: number;
  rt_steam_release_date: number;
  selected_clientid: string;
  selected_per_client_data: {
    bytes_downloaded: string;
    bytes_total: string;
    client_name: string;
    clientid: string;
    cloud_status: number;
    display_status: number;
    installed: boolean;
    is_available_on_current_platform: boolean;
    status_percentage: number;
  };
  size_on_disk: string;
  sort_as: string;
  steam_deck_compat_category: number;
  visible_in_game_list: boolean;
  vr_only?: boolean;
  vr_supported?: boolean;
}

declare global {
  export interface Window {
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
      ToggleSideMenu: (menu?: number) => void;
      // Currently open menu (same number values as above)
      m_eOpenSideMenu?: number;

      NavigateToLibraryTab: () => void;
      NavigateBackOrOpenMenu: () => void;

      VirtualKeyboardManager: {
        IsShowingVirtualKeyboard: {
          m_currentValue: boolean;
          // Returns unsubscribe function
          Subscribe: (callback: (showing: boolean) => void) => {
            Unsubscribe: () => void;
          };
        };
      };
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

    csGetAppPropsMenuItems?: (app: AppPropsApp) => {
      title: string;
    }[];

    // Internal Steam stuff

    webpackJsonp: any;

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
