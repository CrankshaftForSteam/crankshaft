import puzzleIcon from './assets/puzzle-icon.svg';
import { DECK_SELECTORS } from './selectors';
import { deleteAll, info } from './util';

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  fontSize?: number;
  node: HTMLElement;
}

export class MenuManager {
  private entry: 'library' | 'menu';
  private menuItems: MenuItem[];

  private menuContainer!: HTMLElement;
  private footerBoxShadow!: HTMLDivElement;

  private menuItemTemplate!: HTMLDivElement;

  private icons!: Record<string, HTMLDivElement>;

  constructor(entry: 'library' | 'menu') {
    this.entry = entry;
    this.menuItems = [];

    // this code is a horrible mess
    if (entry === 'library' && window.smmUIMode === 'desktop') {
      const collectionsButton = document.querySelector(
        '[class^=gamelistbar_CollectionsButton_]'
      )!;
      const collectionsButtonClasses = Array.from(
        collectionsButton.classList
      ).join(' ');

      const collectionsButtonInner = document.querySelector(
        '[class*=gamelisthome_CollectionButton_]'
      )!;
      const collectionsButtonInnerClasses = Array.from(
        collectionsButtonInner.classList
      ).join(' ');

      deleteAll('[data-smm-menu-style]');
      const style = (
        <style data-smm-menu-style>{`
          [data-smm-menu-button]:hover img {
            filter: brightness(10);
          }

          [data-smm-menu-button] button:focus {
            outline: none;
          }

          [data-smm-menu-page] h1 {
            margin: 0;
          }
        `}</style>
      );
      document.querySelector('head')?.appendChild(style);

      // ----

      deleteAll('[data-smm-menu-button]');
      const modsButton = (
        <div
          className={collectionsButtonClasses}
          style={{
            width: 36,
            height: 36,
          }}
          data-smm-menu-button
        >
          <button
            className={collectionsButtonInnerClasses}
            style={{
              width: '100%',
              height: 32,
              padding: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: 'none',
              filter: 'brightness(1)',
              transition: 'all 150ms',
            }}
          >
            <img src={puzzleIcon} style={{ width: 20 }} />
          </button>
        </div>
      );

      collectionsButton.parentNode?.appendChild(modsButton);

      deleteAll('[data-smm-menu-page]');
      const menuPage = (
        <div
          style={{
            display: 'none',
            width: '100%',
            padding: 12,
            backgroundColor: '#1a1d23',
          }}
          data-smm-menu-page
        >
          <h1>Mods</h1>
        </div>
      );

      const showMenuPage = () => {
        menuPage.style.display = 'unset';
        info('showMenuPage');

        const closeHandler = (event: MouseEvent) => {
          info(
            'close handler',
            (event.target as HTMLElement)?.closest('[data-smm-menu-page]')
          );
          const target = event.target as HTMLElement | undefined;
          if (
            !(
              target?.closest('[data-smm-menu-page]') ||
              target?.closest('[data-smm-menu-button]') ||
              target?.closest('[data-smm-modal]')
            )
          ) {
            menuPage.style.display = 'none';
            document.removeEventListener('click', closeHandler);
          }
        };

        document.addEventListener('click', closeHandler);
      };

      modsButton.addEventListener('click', showMenuPage);

      document
        .querySelector('[class^=library_Container_]')
        ?.appendChild(menuPage);

      this.menuContainer = document.createElement('ul');
      menuPage.appendChild(this.menuContainer);
    }

    if (entry === 'menu' && window.smmUIMode === 'deck') {
      this.injectIntoDeckMenu();
    }
  }

  injectIntoDeckMenu() {
    deleteAll('[data-smm-menu-item-style]');
    deleteAll('[data-smm-menu-item]');

    this.menuContainer = document.querySelector<HTMLDivElement>(
      DECK_SELECTORS.menuContainer
    )!;

    this.footerBoxShadow = document.querySelector<HTMLDivElement>(
      DECK_SELECTORS.menuFooterBoxShadow
    )!;

    // Find first non-active item
    let menuItem = this.menuContainer.childNodes[0] as HTMLDivElement;
    for (const _node of this.menuContainer.childNodes) {
      const node = _node as HTMLDivElement;

      if (node.querySelector(DECK_SELECTORS.menuItemActive)) {
        continue;
      }

      menuItem = node;
      break;
    }
    const menuItemClass = Array.from(menuItem.classList).find((c) =>
      /^mainmenu_ItemOuter_/.exec(c)
    );

    // Make the menu scroll
    // ====================
    this.menuContainer.style.overflow = 'scroll';
    this.menuContainer.style.justifyContent = 'unset';

    this.footerBoxShadow.style.height = '0';

    const menuItemStyle = document.createElement('style');
    menuItemStyle.dataset.smmMenuItemStyle = '';
    menuItemStyle.innerHTML = `.${menuItemClass} { flex-shrink: 0 !important; }`;
    document.querySelector('head')?.appendChild(menuItemStyle);
    // ====================

    this.menuItemTemplate = document.importNode(
      menuItem,
      true
    ) as HTMLDivElement;

    // Get icons
    this.icons = {};
    document.querySelectorAll(DECK_SELECTORS.menuItem).forEach((item) => {
      const name = item
        .querySelector(DECK_SELECTORS.menuItemLabel)!
        .textContent!.toLowerCase();
      const icon = document.importNode<HTMLDivElement>(
        item.querySelector(DECK_SELECTORS.menuItemIcon)!,
        true
      );
      this.icons[name] = icon;
    });
  }

  addMenuItem(
    item: Omit<MenuItem, 'node'>,
    onClick: (event: MouseEvent) => void
  ) {
    let newMenuItem: HTMLElement;
    if (this.entry === 'menu') {
      newMenuItem = document.importNode(
        this.menuItemTemplate,
        true
      ) as HTMLDivElement;

      let label = newMenuItem.querySelector<HTMLDivElement>(
        DECK_SELECTORS.menuItemLabel
      )!;
      label.innerHTML = item.label;

      if (item.fontSize) {
        label.style.fontSize = `${item.fontSize}px`;
      }

      if (item.icon) {
        newMenuItem.querySelector(DECK_SELECTORS.menuItemIcon)?.remove();
        (newMenuItem.childNodes[0] as HTMLDivElement).prepend(
          document.importNode(this.icons[item.icon], true)
        );
      }
    } else {
      newMenuItem = (
        <li>
          <button>{item.label}</button>
        </li>
      );
      // ====
    }

    newMenuItem.dataset.smmMenuItem = item.id;
    newMenuItem.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick(event);
    });

    this.menuContainer.insertBefore(newMenuItem, this.footerBoxShadow);

    this.menuItems.push({ ...item, node: newMenuItem });
  }

  removeMenuItem(id: string) {
    const index = this.menuItems.findIndex((item) => item.id === id);
    this.menuItems[index].node.remove();
    this.menuItems.splice(index, 1);
  }
}
