import { SMM } from '../SMM';
import { info } from '../util';

const main = async () => {
  info('Successfully injected app properties script');

  if (window.smmUIMode !== 'desktop') {
    return;
  }

  const smm = new SMM('appProperties');
  if (window.smm) {
    delete window.smm;
  }
  window.smm = smm;

  await smm.loadPlugins();
};

main();
