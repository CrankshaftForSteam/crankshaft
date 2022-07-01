import { dcCreateElement } from '../dom-chef';
import { GamepadHandler } from '../gamepad';
import { DECK_SELECTORS } from '../selectors';
import { SMM } from '../smm';
import { deleteAll } from '../util';
import { MenuInjector, MenuItem, MenuManager } from './menu-manager';

// @use-dom-chef

export class MenuInjectorDeck implements MenuInjector {
  private readonly smm: SMM;
  private readonly menuManager: MenuManager;

  private pageContainer: HTMLDivElement;
  private enteredWithNavigate: boolean;
  // Defined while a plugin page is shown
  private active?: {
    page: HTMLDivElement;
    gamepad: GamepadHandler;
  };

  constructor(smm: SMM, menuManager: MenuManager) {
    this.smm = smm;
    this.menuManager = menuManager;
    this.enteredWithNavigate = false;

    deleteAll('[data-smm-menu-page-container]');
    this.pageContainer = dcCreateElement<HTMLDivElement>(
      <div
        style={{
          width: '100%',
          height: 'calc(100% - 40px)',
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 'auto',
          zIndex: 999,
          overflow: 'scroll',
          backgroundColor: '#23262e',
          opacity: 0,
          pointerEvents: 'none',
        }}
        data-smm-menu-page-container
      />
    );
    document.body.appendChild(this.pageContainer);

    this.smm.IPC.on<{ id: string }>(
      'csMenuItemClicked',
      async ({ data: { id } }) => {
        try {
          await this.openPage(id);
        } catch (err) {
          console.error(err);
          this.smm.Toast.addToast('Error opening plugin.', 'error');
        }
      }
    );
  }

  async openPage(id: string) {
    // Close current page
    if (this.active) {
      await this.closeActivePage();
    }

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

    const item = this.menuManager.menuItems.find((i) => i.id === id);
    if (!item) {
      throw new Error(`Menu item ${id} not found`);
    }

    const page = dcCreateElement<HTMLDivElement>(
      <div
        style={{
          height: 'calc(100% - 8px)',
          padding: '4px 12px',
          backgroundColor: '#23262e',
        }}
      />
    );

    this.pageContainer.innerHTML = '';
    this.pageContainer.appendChild(page);

    item.render(this.smm, page);
    this.showPageContainer();

    window.csMenuActiveItem = item.id;

    const gamepad = new GamepadHandler({
      smm: this.smm,
      root: this.pageContainer,
      rootExitCallback: () => this.closeActivePage(),
    });

    this.active = {
      page,
      gamepad,
    };
  }

  async closeActivePage() {
    if (!this.active) {
      return;
    }

    const { page, gamepad } = this.active;

    // Fade out the plugin page before removing it
    const animation = await this.pageContainer.animate([{ opacity: 0 }], {
      duration: 300,
      fill: 'forwards',
    }).finished;
    this.hidePageContainer();
    page.remove();
    animation.cancel();

    gamepad.cleanup();

    // Clear active menu item
    window.csMenuActiveItem = undefined;
    window.csMenuUpdate?.();

    if (this.enteredWithNavigate) {
      window.coolClass.NavigateBackOrOpenMenu();
    }

    this.active = undefined;
  }

  createMenuItem({ id, label, fontSize }: MenuItem) {
    window.csMenuItems ||= [];
    window.csMenuItems.push({
      id,
      label,
    });
    window.csMenuUpdate?.();
  }

  removeMenuItem(id: string) {
    window.csMenuItems = window.csMenuItems?.filter((i) => i.id !== id);
    window.csMenuUpdate?.();
  }

  showPageContainer() {
    this.pageContainer.style.opacity = '1';
    this.pageContainer.style.pointerEvents = 'all';
  }

  hidePageContainer() {
    this.pageContainer.style.opacity = '0';
    this.pageContainer.style.pointerEvents = 'none';
  }
}
