import { MENU_DECK_SELECTORS } from './selectors';

// Enable scrolling in the Deck main menu
export const enableDeckMenuScroll = async () => {
  const menuContainer = document.querySelector<HTMLDivElement>(
    MENU_DECK_SELECTORS.menuContainer
  );
  if (!menuContainer) {
    throw new Error('menuContainer not found');
  }

  const menuItem = menuContainer.childNodes[0] as HTMLDivElement;
  if (!menuItem) {
    throw new Error('menuItem not found');
  }

  const menuItemClass = Array.from(menuItem.classList).find((c) =>
    /^mainmenu_ItemOuter_/.exec(c)
  );
  if (!menuItemClass) {
    throw new Error('menuItemClass not found');
  }

  const stylesheet = new CSSStyleSheet();
  await (stylesheet as any).replace(`
			${MENU_DECK_SELECTORS.menuContainer} {
				overflow: scroll !important;
				justify-content: unset !important;
			}

			${MENU_DECK_SELECTORS.menuFooterBoxShadow} {
				height: 0;
			}
			
			.${menuItemClass} {
				flex-shrink: 0 !important;
			}
		`);

  (document as any).adoptedStyleSheets = [
    ...(document as any).adoptedStyleSheets,
    stylesheet,
  ];
};
