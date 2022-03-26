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

  createMenuItem({ label }: { label: string; fontSize?: number | undefined }) {
    const newMenuItem = (
      <li>
        <button
          style={{
            backgroundColor: 'rgba(255, 255, 255, 5%)',
            color: 'rgba(255, 255, 255, 90%)',
            border: 'none',
            fontSize: 16,
            padding: '8px 24px',
            borderRadius: 8,
            transition: 'all 150ms',
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      </li>
    ) as unknown as HTMLLIElement;

    this.menuContainer.appendChild(newMenuItem);

    return newMenuItem;
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

          [data-smm-menu-page] h1 {
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

      const closeHandler = (event: MouseEvent) => {
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

    const libaryContainer = document.querySelector(
      MENU_DESKTOP_SELECTORS.libraryContainer
    );
    if (!libaryContainer) {
      throw new InjectError('libraryContainer not found');
    }

    libaryContainer.appendChild(menuPage);

    this.menuContainer = (
      <ul style={{ listStyle: 'none', padding: 0 }} />
    ) as unknown as HTMLUListElement;
    menuPage.appendChild(this.menuContainer);
  }
}
