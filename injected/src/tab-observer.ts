import {
  DECK_SELECTORS,
  DESKTOP_SELECTORS,
  getSelectorByMode,
  SHARED_SELECTORS,
} from './selectors';
import { SMM } from './SMM';

export const createTabObserver = (smm: SMM, mainLibraryEl: HTMLElement) => {
  // Cleanup previous observer
  if (window.smmTabObserver) {
    window.smmTabObserver.disconnect();
    delete window.smmTabObserver;
  }

  const observer = new MutationObserver((_mutationsList) => {
    // Shared
    if (document.querySelector(getSelectorByMode('home'))) {
      smm.switchToHome();
      return;
    }

    // Desktop library
    if (window.smmUIMode === 'desktop') {
      if (document.querySelector(DESKTOP_SELECTORS.collections)) {
        smm.switchToCollections();
        return;
      } else if (document.querySelector(SHARED_SELECTORS.appDetails)) {
        const storeUrl = document.querySelector<HTMLLinkElement>(
          DESKTOP_SELECTORS.appDetailsStoreLink
        )?.href;
        if (!storeUrl) {
          return;
        }
        const appId = new URL(storeUrl).pathname.split('/')[2];

        const appName = document.querySelector(
          DESKTOP_SELECTORS.selectedEntry
        )?.textContent;
        if (!appName) {
          return;
        }

        smm.switchToAppDetails(appId, appName);
        return;
      }
    }

    // Deck library
    if (window.smmUIMode === 'deck') {
      if (document.querySelector(SHARED_SELECTORS.appDetails)) {
        const src = document.querySelector<HTMLImageElement>(
          DECK_SELECTORS.appDetailsHeaderImg
        )?.src;
        const appId = src?.match(
          /^https:\/\/steamloopback\.host\/assets\/(\d+)_/
        )?.[1];
        if (!appId) {
          return;
        }

        const appName = document.querySelector(
          SHARED_SELECTORS.appDetailsName
        )?.textContent;
        if (!appName) {
          return;
        }

        smm.switchToAppDetails(appId, appName);
        return;
      }
    }

    smm.switchToUnknownPage();
  });

  observer.observe(mainLibraryEl, { subtree: true, childList: true });
  window.smmTabObserver = observer;
};
