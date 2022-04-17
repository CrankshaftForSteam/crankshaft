import { loadCrankshaftSettings, loadPluginManager } from '../internal-plugins';
import { MENU_DECK_SELECTORS } from '../menu-manager/selectors';
import { SMM } from '../SMM';
import { info, waitForElement } from '../util';

const main = async () => {
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

  loadCrankshaftSettings(smm);
  loadPluginManager(smm);

  await smm.loadPlugins();
};

main();
