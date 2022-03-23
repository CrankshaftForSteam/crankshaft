import { loadProtonUpdaterPlugin } from '../proton-updater-plugin';
import { SMM } from '../SMM';
import { info } from '../util';

const main = () => {
  info('Successfully injected menu script');

  if (window.smmUIMode === 'desktop') {
    return;
  }

  const smm = new SMM('menu');
  if (window.smm) {
    delete window.smm;
  }
  window.smm = smm;

  loadProtonUpdaterPlugin(smm);
};

main();
