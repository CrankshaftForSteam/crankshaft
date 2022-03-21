import { loadProtonDBPlugin } from './protondb-plugin';
import { SMM } from './SMM';
import { createTabObserver } from './tab-observer';
import { info } from './util';

{
  const start = () => {
    info('Successfully injected script');

    const smm = new SMM();
    window.smm = smm;

    const mainLibraryEl = document.querySelector<HTMLDivElement>(
      '[class^=library_AppDetailsMain]'
    )!;

    createTabObserver(smm, mainLibraryEl);

    loadProtonDBPlugin(smm);
  };

  start();
}
