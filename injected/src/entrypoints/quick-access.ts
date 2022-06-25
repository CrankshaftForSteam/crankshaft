import { DECK_SELECTORS } from '../selectors';
import { SMM } from '../smm';
import { info, waitForElement } from '../util';

const main = async () => {
  info('Successfully injected quick access script');

  if (window.smmUIMode === 'desktop') {
    return;
  }

  waitForElement(DECK_SELECTORS.quickAccessContainer);

  const smm = new SMM('quickAccess');
  if (window.smm) {
    delete window.smm;
  }
  window.smm = smm;

  await smm.loadPlugins();
};

main();
