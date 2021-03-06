import { logoIcon } from '../assets/assets';
import { dcCreateElement } from '../dom-chef';
import { SMM } from '../smm';
import { deleteAll } from '../util';
import { MenuInjector, MenuItem } from './menu-manager';
import { MENU_DESKTOP_SELECTORS } from './selectors';

// @use-dom-chef

class InjectError extends Error {
  constructor(msg: string) {
    super(`Error injecting into desktop menu: ${msg}`);
  }
}

export class MenuInjectorDesktop implements MenuInjector {
  private readonly smm: SMM;
  private menuContainer!: HTMLUListElement;
  private modsButton!: HTMLElement;
  private pageContainer!: HTMLDivElement;
  private itemNodes: Record<string, HTMLElement>;

  constructor(smm: SMM) {
    this.smm = smm;

    this.itemNodes = {};

    const collectionsButton = document.querySelector<HTMLDivElement>(
      MENU_DESKTOP_SELECTORS.collectionsButton
    );
    if (!collectionsButton) {
      throw new InjectError('collectionsButton not found');
    }

    this.injectMenuStyles();

    this.modsButton = this.createModsButton(collectionsButton);

    this.createMenuPage(this.modsButton);
  }

  createMenuItem({ id, label, render }: MenuItem) {
    const handleClick = async (event: MouseEvent) => {
      event?.stopPropagation();
      const root = this.getRootForMenuItem(id);
      await render(this.smm, root);
    };

    const newMenuItem = dcCreateElement<HTMLLIElement>(
      <li onClick={handleClick} smm-menu-item={id}>
        <button
          style={{
            width: '100%',
          }}
          className="smm-menu-item-button"
          data-smm-menu-item-button={id}
        >
          {label}
        </button>
      </li>
    );

    this.itemNodes[id] = newMenuItem;

    this.menuContainer.appendChild(newMenuItem);
  }

  removeMenuItem(id: string) {
    if (!this.itemNodes[id]) {
      return;
    }

    this.itemNodes[id].remove();
    delete this.itemNodes[id];
  }

  getRootForMenuItem(id: string) {
    document
      .querySelectorAll(`[data-smm-menu-item-button]`)
      ?.forEach((node) => node.classList.remove('active'));
    document
      .querySelector(`[data-smm-menu-item-button="${id}"]`)
      ?.classList.add('active');

    [...this.pageContainer.childNodes].forEach((node) => node.remove());
    this.pageContainer.style.display = 'unset';
    return this.pageContainer;
  }

  private injectMenuStyles() {
    deleteAll('[data-smm-menu-style]');
    document.querySelector('head')?.appendChild(
      dcCreateElement<HTMLStyleElement>(
        <style data-smm-menu-style>{`
          [data-smm-menu-button] > button > img {
            filter: brightness(0.4);
            transition: all 150ms;
          }
          
          [data-smm-menu-button]:hover > button > img {
            filter: brightness(1);
          }

          [data-smm-menu-button] > button:focus {
            outline: none;
          }

          [data-smm-menu-page-container] h1 {
            margin: 0;
          }

          [data-smm-menu-item] {
            cursor: pointer;
          }

          [data-smm-menu-item]:hover {
              background-color: 'rgba(255, 255, 255, 15%)',
          }

          [data-smm-menu-item]:focus {
            outline: none;
          }

          [data-smm-menu-item]:focus-visible {
            outline: inherit;
          }

          .smm-menu-item-button {
            background-color: rgba(255, 255, 255, 2%);
            color: rgba(255, 255, 255, 90%);
            border: none;
            font-size: 16px;
            padding: 8px 24px;
            transition: all 150ms;
            cursor: pointer;
          }

          .smm-menu-item-button:hover {
            background-color: rgba(255, 255, 255, 4%);
          }

          .smm-menu-item-button.active {
            background-color: #23262e;
          }

          .smm-menu-item-button:focus {
            outline: none;
          }

          .smm-menu-item-button:focus-visible {
            outline: auto 1px white;
          }
        `}</style>
      )
    );
  }

  private createModsButton(collectionsButton: HTMLDivElement): HTMLElement {
    // Get classes to use in styles
    const collectionsButtonClasses = Array.from(
      collectionsButton.classList
    ).join(' ');

    const collectionsButtonInner = document.querySelector(
      MENU_DESKTOP_SELECTORS.collectionsButtonInner
    )!;
    if (!collectionsButtonInner) {
      throw new InjectError('collectionsButtonInner not found');
    }
    const collectionsButtonInnerClasses = Array.from(
      collectionsButtonInner.classList
    ).join(' ');

    const collectionsButtonParent = collectionsButton.parentNode;
    if (!collectionsButtonParent) {
      throw new InjectError('collectionsButtonParent not found');
    }

    deleteAll('[data-smm-menu-button]');

    return collectionsButtonParent.appendChild(
      dcCreateElement<HTMLDivElement>(
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
            <img src={logoIcon} style={{ width: 24 }} />
          </button>
        </div>
      )
    );
  }

  private createMenuPage(modsButton: HTMLElement) {
    deleteAll('[data-smm-menu-page]');
    const menuPage = dcCreateElement<HTMLDivElement>(
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#23262e',
          color: '#b8bcbf',
          padding: '4px 12px',
          overflow: 'scroll',
        }}
        data-smm-menu-page
      />
    );
    this.pageContainer = menuPage;

    // TODO: fix these names
    this.menuContainer = dcCreateElement<HTMLUListElement>(
      <ul style={{ listStyle: 'none', width: '100%', margin: 0, padding: 0 }} />
    );

    deleteAll('[data-smm-menu-page-container]');
    const menuContainer = dcCreateElement<HTMLDivElement>(
      <div
        style={{
          display: 'none',
          width: '100%',
          backgroundColor: '#1a1d23',
        }}
        data-smm-menu-page-container
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 200,
          }}
        >
          {this.menuContainer}
        </div>
        {menuPage}
      </div>
    );

    const showMenuPage = () => {
      menuContainer.style.display = 'flex';

      // If user clicked inside one of these, don't close the menu page
      const csCloseSelectors = [
        '[data-smm-menu-page-container]',
        '[data-smm-menu-button]',
        '[data-smm-modal]',
        '[data-smm-toasts]',
      ];

      const closeHandler = (event: MouseEvent) => {
        const target = event.target as HTMLElement | undefined;
        if (!csCloseSelectors.some((selector) => target?.closest(selector))) {
          menuContainer.style.display = 'none';
          document.removeEventListener('click', closeHandler);
        }
      };

      document.addEventListener('click', closeHandler);
    };

    modsButton.addEventListener('click', showMenuPage);

    const libaryContainer = document.querySelector(
      MENU_DESKTOP_SELECTORS.libraryContainer
    );
    if (!libaryContainer) {
      throw new InjectError('libraryContainer not found');
    }

    libaryContainer.appendChild(menuContainer);
  }
}
