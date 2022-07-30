import { dcCreateElement } from '../../dom-chef';
import { GamepadHandler } from '../../gamepad';
import { DECK_SELECTORS } from '../../selectors';
import { SMM } from '../../smm';
import { deleteAll } from '../../util';
import { MenuInjector, MenuItem, MenuManager } from '../menu-manager';
import styles from './menu-injector-deck.css';

// @use-dom-chef

export class MenuInjectorDeck implements MenuInjector {
  private readonly smm: SMM;
  private readonly menuManager: MenuManager;

  private enteredWithNavigate: boolean;
  // Container of page with list of plugins and plugin contents
  private pageContainer!: HTMLDivElement;
  // List of plugins in page
  private menuList!: HTMLUListElement;
  private menuItemNodes: Record<string, HTMLLIElement>;
  // Root to render plugin contents
  private menuPage!: HTMLDivElement;

  private menuListGamepad?: GamepadHandler;
  private activePluginGamepad?: GamepadHandler;

  constructor(smm: SMM, menuManager: MenuManager) {
    this.smm = smm;
    this.menuManager = menuManager;
    this.enteredWithNavigate = false;
    this.menuItemNodes = {};

    this.injectMenuStyles();
    this.createPageContainer();
    this.addPluginsMenuItem();
    this.listenToClickEvents();
  }

  private injectMenuStyles() {
    deleteAll('[data-smm-menu-style]');
    document.head.appendChild(
      dcCreateElement<HTMLStyleElement>(
        <style data-smm-menu-style>{styles}</style>
      )
    );
  }

  private createPageContainer() {
    deleteAll('[data-smm-menu-page-container]');

    this.menuList = dcCreateElement<HTMLUListElement>(<ul />);
    this.menuPage = dcCreateElement<HTMLDivElement>(<div data-smm-menu-page />);
    this.pageContainer = dcCreateElement<HTMLDivElement>(
      <div data-smm-menu-page-container>
        {this.menuList}
        {this.menuPage}
      </div>
    );

    document.body.appendChild(this.pageContainer);
  }

  private listenToClickEvents() {
    this.smm.IPC.on<{ id: string }>(
      'csMenuItemClicked',
      async ({ data: { id: _id } }) => {
        this.openPluginsPage();
      }
    );
  }

  private addPluginsMenuItem() {
    window.csMenuItems = [
      {
        id: 'plugins',
        label: 'Plugins',
      },
    ];
    window.csMenuUpdate?.();
  }

  private openPluginsPage() {
    window.csMenuActiveItem = 'plugins';

    // Close menu
    window.coolClass.OpenSideMenu();

    // Make sure we're on a page where we can show the plugin page
    // (we'll navigate back when the page is closed)
    if (
      document.querySelector(DECK_SELECTORS.topLevelTransitionSwitch)?.children
        ?.length === 0
    ) {
      window.coolClass.NavigateToLibraryTab();
      this.enteredWithNavigate = true;
    }

    this.showPageContainer();

    this.menuListGamepad = new GamepadHandler({
      smm: this.smm,
      root: this.menuList,
      rootExitCallback: () => {
        this.closePluginsPage();
        this.menuListGamepad?.cleanup();
        this.menuListGamepad = undefined;
      },
    });
  }

  private async closePluginsPage() {
    // Fade out the plugin page before removing it
    const animation = await this.pageContainer.animate([{ opacity: 0 }], {
      duration: 300,
      fill: 'forwards',
    }).finished;
    this.hidePageContainer();
    animation.cancel();

    // Clear active menu item
    window.csMenuActiveItem = undefined;
    window.csMenuUpdate?.();

    if (this.enteredWithNavigate) {
      window.coolClass.NavigateBackOrOpenMenu();
    }
  }

  private showPageContainer() {
    this.pageContainer.style.opacity = '1';
    this.pageContainer.style.pointerEvents = 'all';
  }

  private hidePageContainer() {
    this.pageContainer.style.opacity = '0';
    this.pageContainer.style.pointerEvents = 'none';
  }

  createMenuItem({ id, label, render }: MenuItem) {
    const newMenuItem = dcCreateElement<HTMLLIElement>(
      <li
        smm-menu-item={id}
        data-cs-gp-in-group="root"
        data-cs-gp-item={id}
        data-cs-gp-init-focus={
          Object.values(this.menuItemNodes).length === 0 ? 'true' : 'false'
        }
        onClick={() => {
          this.openPluginPage(render);
        }}
      >
        <button className="smm-menu-item-button" data-smm-menu-item-button={id}>
          {label}
        </button>
      </li>
    );

    this.menuItemNodes[id] = newMenuItem;
    this.menuList.appendChild(newMenuItem);
  }

  removeMenuItem(id: string) {
    this.menuItemNodes[id]?.remove();
    delete this.menuItemNodes[id];
  }

  closeActivePage() {
    this.activePluginGamepad?.cleanup();
    this.menuListGamepad?.cleanup();
    this.closePluginsPage();
  }

  private openPluginPage(render: MenuItem['render']) {
    [...this.menuPage.children].forEach((node) => node.remove());
    render(this.smm, this.menuPage);
    this.activePluginGamepad = new GamepadHandler({
      smm: this.smm,
      root: this.menuPage,
      rootExitCallback: () => {
        this.activePluginGamepad?.cleanup();
        [...this.menuPage.children].forEach((node) => node.remove());
        this.menuListGamepad?.updateFocused(this.menuListGamepad.focusPath);
      },
    });
  }
}
