import { loadProtonUpdaterPlugin } from '../proton-updater-plugin';
import { loadProtonDBPlugin } from '../protondb-plugin';
import { getSelectorByMode } from '../selectors';
import { SMM } from '../SMM';
import { createTabObserver } from '../tab-observer';
import { info, waitForElement } from '../util';

const main = async () => {
  info('Successfully injected library script');

  const smm = new SMM('library');
  if (window.smm) {
    delete window.smm;
  }
  window.smm = smm;

  await waitForElement(getSelectorByMode('mainLibrary'));

  const mainLibraryEl = document.querySelector<HTMLDivElement>(
    getSelectorByMode('mainLibrary')
  )!;

  createTabObserver(smm, mainLibraryEl);

  loadProtonDBPlugin(smm);

  if (window.smmUIMode === 'desktop') {
    loadProtonUpdaterPlugin(smm);
  }

  document.addEventListener('keydown', (event) => {
    if (event.shiftKey && event.key === 'Tab') {
      window.OpenQuickAccessMenu();
    }
  });
};

main();
