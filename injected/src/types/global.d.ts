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

    OpenQuickAccessMenu: () => void;
  }
}
