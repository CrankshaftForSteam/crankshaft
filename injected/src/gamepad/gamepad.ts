import { BTN_CODE } from './buttons';
import { buildGamepadTree, GamepadTree } from './tree';

export class GamepadHandler {
  root: HTMLElement;
  tree: GamepadTree;
  focusPath: string;
  customHandler?: (buttonCode: number) => void;
  rootExitCallback?: () => void;

  constructor({
    root,
    customHandler,
    rootExitCallback,
  }: {
    root: HTMLElement;
    customHandler?: GamepadHandler['customHandler'];
    rootExitCallback?: GamepadHandler['rootExitCallback'];
  }) {
    this.root = root;
    this.tree = buildGamepadTree(root);
    this.customHandler = customHandler;
    this.rootExitCallback = rootExitCallback;

    const initialFocusEl = Object.values(this.tree).find(
      (child) => child.initialFocus
    );
    if (!initialFocusEl) {
      throw new Error('Initial focus item not found!');
    }
    this.focusPath = initialFocusEl.name;
    this.updateFocused(this.focusPath);

    window.csGp = this;

    window.csButtonInterceptors = window.csButtonInterceptors || [];
    window.csButtonInterceptors.push({
      id: 'gamepad-root',
      handler: (buttonCode) => {
        // Allow all button presses if a menu is open
        if (
          window.coolClass.m_eOpenSideMenu &&
          window.coolClass.m_eOpenSideMenu !== 0
        ) {
          return false;
        }

        // Allow menu buttons
        if (
          buttonCode === BTN_CODE.MENU ||
          buttonCode === BTN_CODE.QUICK_ACCESS
        ) {
          return false;
        }

        if (this.customHandler?.(buttonCode)) {
          return true;
        }

        if (buttonCode === BTN_CODE.B) {
          window.csButtonInterceptors = window.csButtonInterceptors?.filter(
            (i) => i.id !== 'gamepad-root'
          );
          window.csGp = undefined;
          this.rootExitCallback?.();
        }

        console.log('gamepad button pressed:', buttonCode);

        // Intercept button press
        return true;
      },
    });
  }

  cleanup() {
    window.csButtonInterceptors = [];
  }

  updateFocused(newFocusPath: string) {
    const currentFocusEl = this.tree[this.focusPath].el;
    currentFocusEl.classList.remove('cs-gp-focus');

    const newFocusEl = this.tree[newFocusPath].el;
    newFocusEl.classList.add('cs-gp-focus');

    this.focusPath = newFocusPath;
  }

  recalculateTree() {
    this.tree = buildGamepadTree(this.root);
  }
}
