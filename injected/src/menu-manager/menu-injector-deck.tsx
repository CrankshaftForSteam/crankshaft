import { puzzleIcon } from '../assets/assets';
import { dcCreateElement } from '../dom-chef';
import { deleteAll } from '../util';
import { MenuInjector } from './menu-manager';
import { MENU_DECK_SELECTORS } from './selectors';

// @use-dom-chef

class InjectError extends Error {
  constructor(msg: string) {
    super(`Error injecting into Deck menu: ${msg}`);
  }
}

export class MenuInjectorDeck implements MenuInjector<HTMLDivElement> {
  private menuContainer: HTMLDivElement;
  private footerBoxShadow: HTMLDivElement;

  private menuItemTemplate: HTMLDivElement;

  private pageContainer!: HTMLDivElement;

  constructor() {
    deleteAll('[data-smm-menu-item-style]');
    deleteAll('[data-smm-menu-item]');
    deleteAll('[data-smm-menu-page]');

    const menuContainer = document.querySelector<HTMLDivElement>(
      MENU_DECK_SELECTORS.menuContainer
    );
    if (!menuContainer) {
      throw new InjectError('menuContainer not found');
    }
    this.menuContainer = menuContainer;

    const footerBoxShadow = document.querySelector<HTMLDivElement>(
      MENU_DECK_SELECTORS.menuFooterBoxShadow
    );
    if (!footerBoxShadow) {
      throw new InjectError('footerBoxShadow not found');
    }
    this.footerBoxShadow = footerBoxShadow;

    const { menuItemClass, menuItemTemplate } = this.createMenuItemTemplate();
    this.menuItemTemplate = menuItemTemplate;

    this.createMenuPage(menuContainer);

    this.enableMenuScroll(
      this.menuContainer,
      this.footerBoxShadow,
      menuItemClass
    );
  }

  isLoaded() {
    // TODO
    return true;
  }

  createMenuItem({
    label,
    fontSize,
  }: {
    label: string;
    fontSize?: number | undefined;
  }) {
    const newMenuItem = document.importNode(this.menuItemTemplate, true);

    const labelEl = newMenuItem.querySelector<HTMLDivElement>(
      MENU_DECK_SELECTORS.menuItemLabel
    );
    if (!labelEl) {
      throw new Error('Error setting new menu item label');
    }
    labelEl.innerHTML = label;

    if (fontSize) {
      labelEl.style.fontSize = `${fontSize}px`;
    }

    this.menuContainer.insertBefore(newMenuItem, this.footerBoxShadow);

    return newMenuItem;
  }

  getRootForMenuItem(_id: string) {
    this.pageContainer.childNodes.forEach((node) => node.remove());
    this.pageContainer.style.display = 'unset';
    return this.pageContainer;
  }

  private enableMenuScroll(
    menuContainer: HTMLDivElement,
    footerBoxShadow: HTMLDivElement,
    menuItemClass: string
  ) {
    menuContainer.style.overflow = 'scroll';
    menuContainer.style.justifyContent = 'unset';

    footerBoxShadow.style.height = '0';

    const menuItemStyle = dcCreateElement<HTMLStyleElement>(
      <style smm-menu-item-style>
        {`.${menuItemClass} {
        flex-shrink: 0 !important;
      }`}
      </style>
    );

    document.querySelector('head')?.appendChild(menuItemStyle);
  }

  private createMenuItemTemplate() {
    // Find first non-active item to use as template for new menu items
    let menuItem = this.menuContainer.childNodes[0] as HTMLDivElement;
    for (const _node of this.menuContainer.childNodes) {
      const node = _node as HTMLDivElement;

      if (node.querySelector(MENU_DECK_SELECTORS.menuItemActive)) {
        continue;
      }

      menuItem = node;
      break;
    }

    const menuItemClass = Array.from(menuItem.classList).find((c) =>
      /^mainmenu_ItemOuter_/.exec(c)
    );
    if (!menuItemClass) {
      throw new InjectError(`couldn't get menuItemClass`);
    }

    const menuItemTemplate = document.importNode(menuItem, true);
    menuItemTemplate
      .querySelector(MENU_DECK_SELECTORS.menuItemIcon)
      ?.childNodes[0].remove();
    menuItemTemplate
      .querySelector(MENU_DECK_SELECTORS.menuItemIcon)
      ?.appendChild(
        dcCreateElement<HTMLImageElement>(
          <img
            src={puzzleIcon}
            // TODO: add proper way to change svg fill
            style={{ width: 20, filter: 'brightness(225%)' }}
          />
        )
      );

    return { menuItemClass, menuItemTemplate };
  }

  private createMenuPage(menuContainer: HTMLDivElement) {
    const menuPage = dcCreateElement<HTMLDivElement>(
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#23262e',
          display: 'none',
        }}
        data-smm-menu-page
      />
    );
    this.pageContainer = menuPage;
    menuContainer.parentElement?.appendChild(menuPage);
  }
}
