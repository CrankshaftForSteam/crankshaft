import { MENU_DESKTOP_SELECTORS } from '../menu-manager/selectors';
import { SMM } from '../smm';
import { info, waitForElement } from '../util';

const main = async () => {
  info('Successfully injected keyboard script');

  if (window.smmUIMode !== 'desktop') {
    return;
  }

  waitForElement(MENU_DESKTOP_SELECTORS.keyboardContainer);

  const smm = new SMM('keyboard');
  if (window.smm) {
    delete window.smm;
  }
  window.smm = smm;

  await smm.loadPlugins();
};

main();
