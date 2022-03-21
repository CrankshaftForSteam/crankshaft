import { SMM } from '../SMM';
import { info } from '../util';

const SELECTORS = {
  menuContainer: '[class^=mainmenu_Menu_]',
  menuItem: '[class^=mainmenu_Item_]',
  menuItemActive: '[class*=mainmenu_Active_]',
  menuItemLabel: '[class^=mainmenu_ItemLabel_]',
  menuItemIcon: '[class^=mainmenu_ItemIcon_]',
};

const main = () => {
  info('Successfully injected menu script');

  if (window.smmLibraryMode === 'desktop') {
    return;
  }

  const smm = new SMM('menu');
  if (window.smm) {
    delete window.smm;
  }
  window.smm = smm;
};

main();
