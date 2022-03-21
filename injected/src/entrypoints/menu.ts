import { MenuManager } from '../MenuManager';
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

  const menuManager = new MenuManager();
  // @ts-ignore
  window.menuManager = menuManager;
};

main();
