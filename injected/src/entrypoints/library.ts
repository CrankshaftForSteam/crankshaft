import { loadProtonUpdaterPlugin } from '../proton-updater-plugin';
import { loadProtonDBPlugin } from '../protondb-plugin';
import { getSelectorByMode } from '../selectors';
import { SMM } from '../SMM';
import { createTabObserver } from '../tab-observer';
import { info, waitForElement } from '../util';

const main = async () => {
  info('Successfully injected library script');

  if (!document.hasFocus()) {
    await new Promise((resolve) => {
      window.addEventListener('focus', resolve);
    });
  }

  const smm = new SMM('library');
  if (window.smm) {
    delete window.smm;
  }
  window.smm = smm;

  const mainLibraryEl = await waitForElement<HTMLDivElement>(
    getSelectorByMode('mainLibrary')
  );

  createTabObserver(smm, mainLibraryEl);

  loadProtonDBPlugin(smm);

  if (window.smmUIMode === 'desktop') {
    loadProtonUpdaterPlugin(smm);
  }

  document.addEventListener('keydown', (event) => {
    if (event.shiftKey && event.key === 'Tab') {
      window.coolClass.OpenQuickAccessMenu();
    }
  });
};

main();
