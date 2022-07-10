import { GamepadHandler } from './gamepad';
import { BTN_CODE } from './gamepad/buttons';
import { DECK_SELECTORS } from './selectors';
import { SMM } from './smm';
import { AppPropsApp } from './types/global';

type AppPropertiesMenuRender = (
  smm: SMM,
  root: HTMLDivElement,
  app: AppPropsApp
) => void | Promise<void>;

interface AppPropertiesMenuItem {
  id: string;
  title: string;
  render?: AppPropertiesMenuRender;
  // TODO: make this a filtering function instead
  appIds?: number[];
}

export class AppPropertiesMenu {
  private readonly smm: SMM;
  private appPropsMenuOpen: boolean;
  private gamepad?: GamepadHandler;
  items: AppPropertiesMenuItem[];

  constructor(smm: SMM) {
    this.smm = smm;
    this.appPropsMenuOpen = false;
    this.items = [];

    window.csGetAppPropsMenuItems = this.getMenuItems.bind(this);

    this.smm.addEventListener(
      'switchToAppProperties',
      (e: CustomEventInit<AppPropsApp>) => {
        if (typeof e.detail === 'undefined') {
          return;
        }

        const app = e.detail;

        // Make sure this event only happens once after app props is opened
        if (this.appPropsMenuOpen) {
          return;
        }

        const appProps = document.querySelector<HTMLDivElement>(
          DECK_SELECTORS.appProperties
        );
        if (!appProps) {
          return;
        }

        this.appPropsMenuOpen = true;

        let curPluginPage: string | undefined = undefined;

        const observer = new MutationObserver(() => {
          if (!document.querySelector(DECK_SELECTORS.appProperties)) {
            this.appPropsMenuOpen = false;
            observer.disconnect();
          }

          let found = false;

          for (const item of this.getMenuItems({ appid: app.appid })) {
            // Check if this plugin's page is visible and we can render into it
            const root = document.querySelector<HTMLDivElement>(
              `[data-cs-plugin-id="${item.id}"]`
            );
            if (root) {
              // Exit if plugin is already rendered
              if (item.id === curPluginPage) {
                return;
              }

              curPluginPage = item.id;
              found = true;

              // Clear before rendering
              root.innerHTML = '';
              item.render?.(
                this.smm,
                root,
                JSON.parse(root.dataset!.csPluginData!) as AppPropsApp
              );

              if (window.smmUIMode === 'deck') {
                this.smm.ButtonInterceptors.addInterceptor({
                  id: `csAppPropertiesMenu`,
                  handler: (buttonCode) => {
                    if (
                      !this.gamepad &&
                      (buttonCode === BTN_CODE.A ||
                        buttonCode === BTN_CODE.RIGHT)
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
              }

              break;
            }
          }

          if (!found) {
            curPluginPage = undefined;
            this.gamepad?.cleanup();
            this.gamepad = undefined;
            this.smm.ButtonInterceptors.removeInterceptor(
              `csAppPropertiesMenu`
            );
          }
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    );
  }

  addMenuItem(item: AppPropertiesMenuItem) {
    this.items.push(item);
  }

  removeMenuItem(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }

  private getMenuItems(app: Pick<AppPropsApp, 'appid'>) {
    return this.items.filter((item) =>
      item.appIds ? item.appIds.includes(app.appid) : true
    );
  }
}
