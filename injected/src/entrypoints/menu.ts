import { MENU_DECK_SELECTORS } from '../menu-manager/selectors';
import { loadProtonUpdaterPlugin } from '../proton-updater-plugin';
import { SMM } from '../SMM';
import { info, waitForElement } from '../util';

const main = () => {
  info('Successfully injected menu script');

  if (window.smmUIMode === 'desktop') {
    return;
  }

  waitForElement(MENU_DECK_SELECTORS.menuContainer);

  const smm = new SMM('menu');
  if (window.smm) {
    delete window.smm;
  }
  window.smm = smm;

  loadProtonUpdaterPlugin(smm);
};

main();
