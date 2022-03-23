export const SHARED_SELECTORS = {
  appDetails: '[class*=appdetails_Container]',
  appDetailsHeader: '[class^="sharedappdetailsheader_TopCapsule"]',
  appDetailsName: 'span[class^=appdetailsplaysection_PlayBarGameName]',
};

export const DESKTOP_SELECTORS = {
  collections: '[class*=allcollections_Container]',
  appDetailsStoreLink: 'a[class^=appdetailsprimarylinkssection]',
};

export const DECK_SELECTORS = {
  appDetailsHeaderImg: '[class^="sharedappdetailsheader_ImgSrc"]',
  menuContainer: '[class^=mainmenu_Menu_]',
  menuItem: '[class^=mainmenu_Item_]',
  menuItemActive: '[class*=mainmenu_Active_]',
  menuItemLabel: '[class^=mainmenu_ItemLabel_]',
  menuItemIcon: '[class^=mainmenu_ItemIcon_]',
  menuFooterBoxShadow: '[class^=mainmenu_FooterBoxShadow_]',
};

const createModeSelectors = <
  T extends Record<string, Record<typeof window['smmUIMode'], string>>
>(
  obj: T
): { [key in keyof T]: T[key] } => obj;

const MODE_SELECTORS = createModeSelectors({
  mainLibrary: {
    desktop: '[class^=library_AppDetailsMain]',
    deck: '[class^="basiclibrary_TopLevelTransitionSwitch"]',
  },
  home: {
    desktop: '[class*=libraryhome_Container]',
    deck: '[class^=gamepadhome]',
  },
});

export const getSelectorByMode = (name: keyof typeof MODE_SELECTORS) => {
  return MODE_SELECTORS[name][window.smmUIMode];
};
