import { SMM } from '../SMM';

declare global {
  namespace JSX {
    interface Element extends HTMLElement {}
  }

  interface Window {
    smm?: SMM;
    smmTabObserver?: MutationObserver;
    smmServerPort: string;
    smmLibraryMode: 'desktop' | 'deck';

    OpenQuickAccessMenu: () => void;
  }
}
