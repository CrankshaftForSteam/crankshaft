import { dcCreateElement } from '../../dom-chef';
import { SMM } from '../../smm';
import { deleteAll } from '../../util';
import { MenuInjector, MenuItem } from '../menu-manager';
import { MENU_DESKTOP_SELECTORS } from '../selectors';
import styles from './menu-injector-desktop.css';
import { addModsButton } from './mods-button';

// @use-dom-chef

class InjectError extends Error {
  constructor(msg: string) {
    super(`Error injecting into desktop menu: ${msg}`);
  }
}

export class MenuInjectorDesktop implements MenuInjector {
  private readonly smm: SMM;
  private menuContainer!: HTMLUListElement;
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

    this.createMenuPage();

    this.addLibraryObserver();
  }

  createMenuItem({ id, label, render }: MenuItem) {
    const handleClick = async (event: MouseEvent) => {
      event?.stopPropagation();
      const root = this.getRootForMenuItem(id);
      await render(this.smm, root);
    };

    const newMenuItem = dcCreateElement<HTMLLIElement>(
      <li onClick={handleClick} smm-menu-item={id}>
        <button className="smm-menu-item-button" data-smm-menu-item-button={id}>
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
    const style = dcCreateElement<HTMLStyleElement>(
      <style data-smm-menu-style>{styles}</style>
    );
    console.log('STYLE THING AAAAAAAAAAAAAAAAA', style);
    document.head.appendChild(style);
  }

  private createMenuPage() {
    deleteAll('[data-smm-menu-page]');
    const menuPage = dcCreateElement<HTMLDivElement>(
      <div data-smm-menu-page />
    );
    this.pageContainer = menuPage;

    // TODO: fix these names
    this.menuContainer = dcCreateElement<HTMLUListElement>(
      <ul style={{ listStyle: 'none', width: '100%', margin: 0, padding: 0 }} />
    );

    deleteAll('[data-smm-menu-page-container]');
    const menuContainer = dcCreateElement<HTMLDivElement>(
      <div data-smm-menu-page-container>
        <div>{this.menuContainer}</div>
        {menuPage}
      </div>
    );

    const showMenuPage = () => {
      menuContainer.style.display = 'flex';

      // If user clicked inside one of these, don't close the menu page
      const csDontCloseSelectors = [
        '[data-smm-menu-page-container]',
        '[data-smm-menu-button]',
        '[data-smm-modal]',
        '[data-smm-toasts]',
      ];

      const closeHandler = (event: MouseEvent) => {
        const target = event.target as HTMLElement | undefined;
        if (
          !csDontCloseSelectors.some((selector) => target?.closest(selector))
        ) {
          menuContainer.style.display = 'none';
          document.removeEventListener('click', closeHandler);
        }
      };

      document.addEventListener('click', closeHandler);
    };

    const libaryContainer = document.querySelector(
      MENU_DESKTOP_SELECTORS.libraryContainer
    );
    if (!libaryContainer) {
      throw new InjectError('libraryContainer not found');
    }

    libaryContainer.appendChild(menuContainer);

    addModsButton(this.smm, showMenuPage);

    // Make sure mods button gets shown
    const interval = setInterval(() => {
      if (document.querySelector('[data-smm-menu-button]')) {
        clearInterval(interval);
      }
      document
        .querySelector<HTMLLinkElement>(MENU_DESKTOP_SELECTORS.homeButton)
        ?.click();
    }, 250);
  }

  addLibraryObserver() {
    const observer = new MutationObserver(() => {
      // Hide menu page when not on library
      if (!document.querySelector('[data-smm-menu-button]')) {
        const el = document.querySelector<HTMLDivElement>(
          '[data-smm-menu-page-container]'
        );
        if (el?.style.display) {
          el.style.display = 'none';
        }
      }
    });
    observer.observe(document.body, { subtree: true, childList: true });
  }
}
