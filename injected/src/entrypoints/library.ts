import { loadProtonDBPlugin } from '../protondb-plugin';
import { getSelectorByMode } from '../selectors';
import { SMM } from '../SMM';
import { createTabObserver } from '../tab-observer';
import { info } from '../util';

info('Successfully injected library script');

const smm = new SMM('library');
if (window.smm) {
  delete window.smm;
}
window.smm = smm;

const mainLibraryEl = document.querySelector<HTMLDivElement>(
  getSelectorByMode('mainLibrary')
)!;

createTabObserver(smm, mainLibraryEl);

loadProtonDBPlugin(smm);
