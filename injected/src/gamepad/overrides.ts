// In some cases, we override our gamepad handler even if it's active
export const shouldAllowButtonPresses = () => {
  // A Steam side menu is open (Steam menu or quick access)
  if (
    window.coolClass.m_eOpenSideMenu &&
    window.coolClass.m_eOpenSideMenu !== 0
  ) {
    return false;
  }
};
