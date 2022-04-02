import { puzzleIcon } from '../assets/assets';
import { deleteAll } from '../util';
import { MenuInjector } from './menu-manager';
import { MENU_DESKTOP_SELECTORS } from './selectors';

class InjectError extends Error {
  constructor(msg: string) {
    super(`Error injecting into desktop menu: ${msg}`);
  }
}

export class MenuInjectorDesktop implements MenuInjector<HTMLLIElement> {
  private menuContainer!: HTMLUListElement;

  private pageContainer!: HTMLDivElement;

  constructor() {
    const collectionsButton = document.querySelector<HTMLDivElement>(
      MENU_DESKTOP_SELECTORS.collectionsButton
    );
    if (!collectionsButton) {
      throw new InjectError('collectionsButton not found');
    }

    this.injectMenuStyles();

    const modsButton = this.createModsButton(collectionsButton);

    this.createMenuPage(modsButton);
  }

  createMenuItem({ id, label }: { id: string; label: string }) {
    const newMenuItem = (
      <li>
        <button
          style={{}}
          className="smm-menu-item-button"
          data-smm-menu-item-button={id}
        >
          {label}
        </button>
      </li>
    ) as unknown as HTMLLIElement;

    this.menuContainer.appendChild(newMenuItem);

    return newMenuItem;
  }

  renderMenuItem(id: string, element: JSX.Element) {
    this.pageContainer.childNodes.forEach((node) => node.remove());
    this.pageContainer.appendChild(element);
    this.pageContainer.style.display = 'unset';
    document
      .querySelectorAll(`[data-smm-menu-item-button]`)
      ?.forEach((node) => node.classList.remove('active'));
    document
      .querySelector(`[data-smm-menu-item-button="${id}"]`)
      ?.classList.add('active');
  }

  private injectMenuStyles() {
    deleteAll('[data-smm-menu-style]');
    document.querySelector('head')?.appendChild(
      <style data-smm-menu-style>{`
          [data-smm-menu-button]:hover img {
            filter: brightness(10);
          }

          [data-smm-menu-button] button:focus {
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
  }

  private createMenuPage(modsButton: HTMLElement) {
    deleteAll('[data-smm-menu-page]');
    const menuPage = (
      <div
        style={{
          width: '100%',
          height: '100%',
        }}
        data-smm-menu-page
      />
    );
    this.pageContainer = menuPage as unknown as HTMLDivElement;

    // TODO: fix these names
    this.menuContainer = (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} />
    ) as unknown as HTMLUListElement;

    deleteAll('[data-smm-menu-page-container]');
    const menuContainer = (
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
          }}
        >
          {this.menuContainer}
        </div>
        {menuPage}
      </div>
    );

    const showMenuPage = () => {
      menuContainer.style.display = 'flex';

      const closeHandler = (event: MouseEvent) => {
        const target = event.target as HTMLElement | undefined;
        if (
          !(
            target?.closest('[data-smm-menu-page-container]') ||
            target?.closest('[data-smm-menu-button]') ||
            target?.closest('[data-smm-modal]') ||
            target?.closest('[data-smm-toasts]')
          )
        ) {
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
