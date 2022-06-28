import { dcCreateElement } from '../dom-chef';
import { GamepadHandler } from '../gamepad';
import { BTN_CODE } from '../gamepad/buttons';
import { SMM } from '../smm';
import { InGameMenu, InGameMenuInjector, InGameMenuItem } from './in-game-menu';

// @use-dom-chef

export class InGameMenuInjectorDeck implements InGameMenuInjector {
  private readonly smm: SMM;
  private readonly inGameMenu: InGameMenu;

  private gamepad?: GamepadHandler;

  constructor(smm: SMM, inGameMenu: InGameMenu) {
    this.smm = smm;
    this.inGameMenu = inGameMenu;

    if (this.smm.entry === 'library') {
      this.smm.IPC.on<InGameMenuItem>('csQuickAccessAddItem', (e) => {
        this.inGameMenu._addMenuItem(e.data);
      });

      this.smm.IPC.on<{ id: string }>('csQuickAccessRemoveItem', (e) => {
        this.inGameMenu._removeMenuItem(e.data.id);
      });
    }
  }

  createItem(item: InGameMenuItem) {
    if (this.smm.entry === 'quickAccess') {
      // Send an IPC event to the library script to create the menu item
      this.smm.IPC.send<InGameMenuItem>('csQuickAccessAddItem', {
        ...item,
        render: undefined,
      });
      // Wait until the new menu item is created so we can render into it
      const observer = new MutationObserver(() => {
        const panel = document.querySelector<HTMLDivElement>(
          `[data-cs-quick-access-item=${item.id}]`
        );
        if (!panel) {
          return;
        }

        observer.disconnect();

        panel.style.margin = '0 16px';

        const title = dcCreateElement<HTMLHeadingElement>(
          <h1
            style={{
              margin: '0 0 16px',
              color: 'white',
              fontSize: '22px',
              fontWeight: 700,
              lineHeight: '28px',
            }}
          >
            {item.title}
          </h1>
        );
        panel.appendChild(title);

        const root = document.createElement('div');
        panel.appendChild(root);

        item.render?.(this.smm, root);

        // im sorry
        const resizeObserver = new ResizeObserver(() => {
          const panelVisible = panel.offsetWidth > 0 || panel.offsetHeight > 0;
          if (panelVisible) {
            if (
              this.smm.ButtonInterceptors.interceptorExists(
                `csInGameInjector-${item.id}`
              )
            ) {
              return;
            }

            this.smm.ButtonInterceptors.addInterceptor({
              id: `csInGameInjector-${item.id}`,
              buttonFilters: [BTN_CODE.A, BTN_CODE.RIGHT],
              handler: (buttonCode) => {
                if (
                  !this.gamepad &&
                  (buttonCode === BTN_CODE.A || buttonCode === BTN_CODE.RIGHT)
                ) {
                  this.gamepad = new GamepadHandler({
                    smm: this.smm,
                    root,
                    rootExitCallback: () => {
                      this.gamepad?.cleanup();
                      this.gamepad = undefined;
                    },
                  });
                }
              },
            });
            return;
          }

          this.gamepad?.cleanup();
          this.gamepad = undefined;
          this.smm.ButtonInterceptors.removeInterceptor(
            `csInGameInjector-${item.id}`
          );
        });
        resizeObserver.observe(panel);
      });
      observer.observe(document.body, { subtree: true, childList: true });
      return;
    }

    if (!window.csQuickAccessItems) {
      window.csQuickAccessItems = [];
    }

    window.csQuickAccessItems.push(item);
    window.csQuickAccessUpdate?.();
  }

  removeItem(id: string) {
    if (this.smm.entry === 'quickAccess') {
      this.smm.IPC.send<{ id: string }>('csQuickAccessRemoveItem', { id });
      return;
    }

    if (!window.csQuickAccessItems) {
      return;
    }

    window.csQuickAccessItems = window.csQuickAccessItems.filter(
      (i) => i.id !== id
    );
    window.csQuickAccessUpdate?.();
  }
}
