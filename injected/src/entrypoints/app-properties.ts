import { SHARED_SELECTORS } from '../selectors';
import { SMM } from '../SMM';
import { info, waitForElement } from '../util';

const main = async () => {
  info('Successfully injected app properties script');

  if (window.smmUIMode !== 'desktop') {
    return;
  }

  waitForElement(SHARED_SELECTORS.appProperties);

  const smm = new SMM('appProperties');
  if (window.smm) {
    delete window.smm;
  }
  window.smm = smm;

  await smm.loadPlugins();

  const appPropertiesAppId: number | undefined = (window as any)
    .appPropertiesAppId;
  if (appPropertiesAppId) {
    smm.switchToAppProperties(appPropertiesAppId);
  } else {
    console.error('App ID for app properties context not found.');
  }
};

main();
