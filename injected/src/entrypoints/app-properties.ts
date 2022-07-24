import { SHARED_SELECTORS } from '../selectors';
import { SMM } from '../smm';
import { AppPropsApp } from '../types/global';
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

  const appPropertiesApp: AppPropsApp | undefined = (window as any)
    .appPropertiesApp;
  if (appPropertiesApp) {
    smm.switchToAppProperties(appPropertiesApp, document.title);
  } else {
    console.error('App ID for app properties context not found.');
  }
};

main();
