import { SMM } from '../SMM';

declare global {
  namespace JSX {
    interface Element extends HTMLElement {}
  }

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
    };

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
