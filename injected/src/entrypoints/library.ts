import {
  loadCrankshaftSettings,
  loadPluginBrowser,
  loadPluginManager,
} from '../internal-plugins';
import { MENU_DESKTOP_SELECTORS } from '../menu-manager/selectors';
import { getSelectorByMode } from '../selectors';
import { SMM } from '../smm';
import { createTabObserver } from '../tab-observer';
import { info, waitForElement } from '../util';

const main = async () => {
  info('Successfully injected library script');

  let smm: SMM;
  try {
    smm = new SMM('library');
  } catch (err) {
    info('Failed to initialize SMM, waiting for focus and retrying...');
    if (!document.hasFocus()) {
      await new Promise<void>((resolve) => {
        const handleFocus = () => {
          resolve();
          window.removeEventListener('focus', handleFocus);
        };
        window.addEventListener('focus', handleFocus);
      });
    }
    try {
      smm = new SMM('library');
    } catch (err) {
      throw new Error(`Error initializing SMM after retry: ${err}`);
    }
  }

  info('Successfully initialized SMM');

  if (window.smm) {
    delete window.smm;
  }
  window.smm = smm;

  const mainLibraryEl = await waitForElement<HTMLDivElement>(
    getSelectorByMode('mainLibrary')
  );

  if (window.smmUIMode === 'desktop') {
    await waitForElement(MENU_DESKTOP_SELECTORS.collectionsButton);
  }

  createTabObserver(smm, mainLibraryEl);

  // Try to permanently enable CEF debugging
  window.SteamClient?.Settings?.SetCefRemoteDebuggingEnabled(true);

  loadCrankshaftSettings(smm);
  loadPluginManager(smm);
  loadPluginBrowser(smm);

  await smm.loadPlugins();

  if (window.smmUIMode === 'deck') {
    document.addEventListener('keydown', (event) => {
      if (event.shiftKey && event.key === 'Tab') {
        window.coolClass.ToggleSideMenu(2);
      }
    });
  }
};

main();
