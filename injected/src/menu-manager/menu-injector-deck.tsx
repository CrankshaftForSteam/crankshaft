import { MenuManager } from '.';
import { dcCreateElement } from '../dom-chef';
import { GamepadHandler } from '../gamepad';
import { DECK_SELECTORS } from '../selectors';
import { SMM } from '../smm';
import { deleteAll, uuidv4 } from '../util';
import { MenuInjector } from './menu-manager';

// @use-dom-chef

class InjectError extends Error {
  constructor(msg: string) {
    super(`Error injecting into Deck menu: ${msg}`);
  }
}

export class MenuInjectorDeck implements MenuInjector {
  private readonly smm: SMM;
  private readonly menuManager: MenuManager;

  private page!: HTMLDivElement;
  private pageContainer!: HTMLDivElement;
  private interceptorId?: string;
  private gamepad?: GamepadHandler;
  private enteredWithNavigate: boolean;

  constructor(smm: SMM, menuManager: MenuManager) {
    this.smm = smm;
    this.menuManager = menuManager;
    this.enteredWithNavigate = false;

    smm.IPC.on('csMenuItemClicked', (e) => {
      // Close menu
      window.coolClass.OpenSideMenu();

      if (
        document.querySelector(DECK_SELECTORS.topLevelTransitionSwitch)
          ?.children?.length === 0
      ) {
        window.coolClass.NavigateToLibraryTab();
        this.enteredWithNavigate = true;
      }

      const { id } = e.data as { id: string };

      const item = this.menuManager.menuItems.find((i) => i.id === id);
      if (!item) {
        console.error('Menu item', id, 'not found');
        return;
      }

      const root = dcCreateElement<HTMLDivElement>(
        <div
          style={{
            height: 'calc(100% - 8px)',
            padding: '4px 12px',
            backgroundColor: '#23262e',
          }}
        />
      );

      const pageContainer = dcCreateElement<HTMLDivElement>(
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
            opacity: 1,
            overflow: 'scroll',
            backgroundColor: '#23262e',
          }}
          data-smm-menu-page
        >
          {root}
        </div>
      );
      this.pageContainer = pageContainer;

      item.render(this.smm, root);
      document.body.appendChild(pageContainer);

      const interceptorId = uuidv4();
      this.interceptorId = interceptorId;

      window.csMenuActiveItem = item.id;

      this.gamepad = new GamepadHandler({
        smm,
        root: pageContainer,
        rootExitCallback: () => this.closePage(),
      });
    });
  }

  createMenuItem({
    id,
    label,
    fontSize,
  }: {
    id: string;
    label: string;
    fontSize?: number | undefined;
  }) {
    if (!window.csMenuItems) {
      window.csMenuItems = [];
    }

    window.csMenuItems.push({
      id,
      label,
    });

    window.csMenuUpdate?.();
  }

  removeMenuItem(id: string) {
    if (!window.csMenuItems) {
      return;
    }

    window.csMenuItems = window.csMenuItems.filter((i) => i.id !== id);
    window.csMenuUpdate?.();
  }

  private createMenuPage() {
    deleteAll('[data-smm-menu-page]');

    this.page = dcCreateElement<HTMLDivElement>(
      <div
        style={{
          height: 'calc(100% - 8px)',
          padding: '4px 12px',
          backgroundColor: '#23262e',
        }}
      />
    );

    this.pageContainer = dcCreateElement(
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
        }}
        data-smm-menu-page
      >
        {this.page}
      </div>
    );
  }

  closePage() {
    // Fade out the plugin page before removing it
    (async () => {
      await this.pageContainer.animate([{ opacity: 0 }], {
        duration: 300,
        fill: 'forwards',
      }).finished;
      this.pageContainer.remove();
    })();

    this.gamepad?.cleanup();
    this.gamepad = undefined;

    // Clear active item
    window.csMenuActiveItem = undefined;

    window.csMenuUpdate?.();

    if (this.enteredWithNavigate) {
      window.coolClass.NavigateBackOrOpenMenu();
    }
  }
}
