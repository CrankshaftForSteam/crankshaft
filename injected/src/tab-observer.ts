import { SELECTORS } from './selectors';
import { SMM } from './SMM';

export const createTabObserver = (smm: SMM, mainLibraryEl: HTMLElement) => {
  // Cleanup previous observer
  if (window.smmTabObserver) {
    window.smmTabObserver.disconnect();
    delete window.smmTabObserver;
  }

  const observer = new MutationObserver((_mutationsList) => {
    if (document.querySelector(SELECTORS.home)) {
      smm.switchToHome();
    } else if (document.querySelector(SELECTORS.collections)) {
      smm.switchToCollections();
    } else if (document.querySelector(SELECTORS.appDetails)) {
      const storeUrl = document.querySelector<HTMLLinkElement>(
        SELECTORS.appDetailsStoreLink
      )?.href;
      if (!storeUrl) {
        return;
      }
      const appId = new URL(storeUrl).pathname.split('/')[2];
      smm.switchToAppDetails(appId);
    }
  });
  observer.observe(mainLibraryEl, { subtree: true, childList: true });
  window.smmTabObserver = observer;
};
