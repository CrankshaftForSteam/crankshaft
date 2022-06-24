import { BTN_CODE } from './buttons';

// In some cases, we override our gamepad handler even if it's active
export const shouldAllowButtonPress = (buttonCode: number) => {
  // A Steam side menu is open (Steam menu or quick access)
  if (
    window.coolClass.m_eOpenSideMenu &&
    window.coolClass.m_eOpenSideMenu !== 0
  ) {
    return true;
  }

  // Web browser is open
  if (window.uiStore.m_history.location.pathname.startsWith('/externalweb')) {
    return true;
  }

  // Allow main/quick access menu buttons
  if ([BTN_CODE.MENU, BTN_CODE.QUICK_ACCESS].includes(buttonCode)) {
    return true;
  }

  return false;
};
