import { loadProtonDBPlugin } from './protondb-plugin';
import { getSelectorByMode } from './selectors';
import { SMM } from './SMM';
import { createTabObserver } from './tab-observer';
import { info } from './util';

{
  const start = () => {
    info('Successfully injected script');

    const smm = new SMM();
    if (window.smm) {
      delete window.smm;
    }
    window.smm = smm;

    const mainLibraryEl = document.querySelector<HTMLDivElement>(
      getSelectorByMode('mainLibrary')
    )!;

    createTabObserver(smm, mainLibraryEl);

    loadProtonDBPlugin(smm);
  };

  start();
}
