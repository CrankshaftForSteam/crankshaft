export const SHARED_SELECTORS = {
  appDetails: '[class*=appdetails_Container]',
  appDetailsHeader: '[class^="sharedappdetailsheader_TopCapsule"]',
  appDetailsName: 'span[class^=appdetailsplaysection_PlayBarGameName]',
};

export const DESKTOP_SELECTORS = {
  collections: '[class*=allcollections_Container]',
  appDetailsStoreLink: 'a[class^=appdetailsprimarylinkssection]',
  selectedEntry: '[class*=gamelistentry_Selected_]',
};

export const DECK_SELECTORS = {
  appDetailsHeaderImg: '[class^="sharedappdetailsheader_ImgSrc"]',
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
