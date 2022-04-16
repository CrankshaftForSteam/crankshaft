import { loadPluginManager } from '../internal-plugins';
import { getSelectorByMode } from '../selectors';
import { SMM } from '../SMM';
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
      await new Promise((resolve) => {
        window.addEventListener('focus', resolve);
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

  createTabObserver(smm, mainLibraryEl);

  if (window.smmUIMode === 'desktop') {
    loadPluginManager(smm);
  }

  await smm.loadPlugins();

  if (window.smmUIMode === 'deck') {
    document.addEventListener('keydown', (event) => {
      if (event.shiftKey && event.key === 'Tab') {
        window.coolClass.OpenQuickAccessMenu();
      }
    });
  }
};

main();
