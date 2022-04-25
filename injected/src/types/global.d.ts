import { SMM } from '../SMM';

declare global {
  interface Window {
    smm?: SMM;
    smmTabObserver?: MutationObserver;
    smmServerPort: string;
    smmUIMode: 'desktop' | 'deck';
    smmPlugins: Record<
      string,
      {
        load: (smm: SMM) => void | Promise<void>;
        unload?: (smm: SMM) => void | Promise<void>;
      }
    >;

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

    csButtonInterceptors?: {
      id: string;
      handler: (buttonCode: number) => void | boolean;
    }[];

    SteamClient: {
      Settings: {
        SetCefRemoteDebuggingEnabled: (value: boolean) => void;
      };
    };

    settingsStore: {
      m_Settings: {
        bCefRemoteDebuggingEnabled: boolean;
      };
    };
  }
}
