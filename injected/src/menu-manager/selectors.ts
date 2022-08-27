export const MENU_DECK_SELECTORS = {
  menuContainer: '[class^=mainmenu_Menu_]',
  menuItem: '[class^=mainmenu_Item_]',
  menuItemActive: '[class*=mainmenu_Active_]',
  menuItemLabel: '[class^=mainmenu_ItemLabel_]',
  menuItemIcon: '[class^=mainmenu_ItemIcon_]',
  menuFooterBoxShadow: '[class^=mainmenu_FooterBoxShadow_]',
} as const;

export const MENU_DESKTOP_SELECTORS = {
  collectionsButton: '[class*=gamelistbar_CollectionsButton]',
  collectionsButtonInner: '[class*=gamelisthome_CollectionButton_]',
  libraryContainer: '[class^=library_Container_]',
  homeButton: '[class*=gamelistbar_HomeBox_] [class*=gamelisthome_Bar_]',
  keyboardContainer: '[class^=virtualkeyboard_Keyboard_]',
};
