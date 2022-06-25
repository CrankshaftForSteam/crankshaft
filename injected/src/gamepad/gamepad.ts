import { SMM } from '../SMM';
import { isOutsideContainer } from '../util';
import { attachBasicGamepadHandler } from './basic-handler';
import { BTN_CODE } from './buttons';
import { shouldAllowButtonPress } from './overrides';
import {
  buildGamepadTree,
  children as childrenFilter,
  GamepadTree,
  siblings as siblingsFilter,
} from './tree';

export class GamepadHandler {
  smm: SMM;
  root: HTMLElement;
  tree: GamepadTree;
  focusPath!: string;
  rootExitCallback?: () => void;

  constructor({
    smm,
    root,
    rootExitCallback,
  }: {
    smm: SMM;
    root: HTMLElement;
    rootExitCallback?: GamepadHandler['rootExitCallback'];
  }) {
    this.smm = smm;
    this.root = root;
    this.tree = buildGamepadTree(root);
    this.rootExitCallback = rootExitCallback;

    const initialFocusEl = Object.values(this.tree).find(
      (child) => child.initialFocus
    );
    if (!initialFocusEl) {
      // TODO: make it more explicit if a page/plugin has gamepad support?
      console.log(
        'GamepadHandler - Initial focus item not found, using basic handler...'
      );
      attachBasicGamepadHandler(rootExitCallback);
      return;
    }
    this.focusPath = initialFocusEl.name;
    this.updateFocused(this.focusPath);

    smm._setActiveGamepadHandler(this);

    window.csButtonInterceptors = window.csButtonInterceptors || [];
    window.csButtonInterceptors.push({
      id: 'gamepad-root',
      handler: (buttonCode) =>
        this.handleButtonPress({
          buttonCode,
          interceptorId: 'gamepad-root',
          onExit: () => {
            smm._setActiveGamepadHandler(undefined);
            this.rootExitCallback?.();
          },
        }),
    });
  }

  cleanup() {
    window.csButtonInterceptors = [];
  }

  private updateFocused(newFocusPath: string) {
    const curFocus = this.tree[this.focusPath];
    if (curFocus) {
      curFocus.el.classList.remove('cs-gp-focus');
    }

    document
      .querySelectorAll('.cs-gp-focus')
      .forEach((node) => node.classList.remove('cs-gp-focus'));

    const newFocusEl = this.tree[newFocusPath].el;
    newFocusEl.classList.add('cs-gp-focus');

    this.focusPath = newFocusPath;

    // Scroll newly focused element into view if needed
    if (isOutsideContainer(newFocusEl, this.root)) {
      newFocusEl.scrollIntoView({ behavior: 'smooth' });
    }
  }

  recalculateTree() {
    this.tree = buildGamepadTree(this.root);

    // If currently focused disappears, find initial focus again
    if (!this.tree[this.focusPath]) {
      const initialFocusEl = Object.values(this.tree).find(
        (child) => child.initialFocus
      );
      if (!initialFocusEl) {
        throw new Error(
          'Focused child dissapeared, new child with initial focus could not be found'
        );
      }
      this.focusPath = initialFocusEl.name;
      this.updateFocused(this.focusPath);

      window.csButtonInterceptors = window.csButtonInterceptors?.filter(
        ({ id }) => id === 'gamepad-root'
      );
    }
  }

  private move(direction: 'up' | 'down') {
    const cur = this.tree[this.focusPath];
    const siblings = Object.values(this.tree).filter(siblingsFilter(cur));
    const next = siblings.find(
      (s) => s.position === cur.position + (direction === 'up' ? -1 : 1)
    );
    if (next) {
      this.updateFocused(next.name);
    }
  }

  private enterGroup(groupName: string) {
    const children = Object.values(this.tree).filter(childrenFilter(groupName));
    if (!children[0]) {
      return;
    }

    this.updateFocused(children[0].name);

    const exitGroup = () => {
      this.updateFocused(groupName);
    };

    const interceptorId = `gamepad-${groupName}`;
    window.csButtonInterceptors = window.csButtonInterceptors || [];
    window.csButtonInterceptors.push({
      id: interceptorId,
      handler: (buttonCode) =>
        this.handleButtonPress({
          buttonCode,
          interceptorId,
          onExit: exitGroup,
        }),
    });
  }

  private handleButtonPress({
    buttonCode,
    interceptorId,
    onExit,
  }: {
    buttonCode: number;
    interceptorId: string;
    onExit?: () => void;
  }): boolean {
    // Allow button presses in some cases
    if (shouldAllowButtonPress(buttonCode)) {
      return false;
    }

    this.recalculateTree();

    switch (buttonCode) {
      case BTN_CODE.UP:
      case BTN_CODE.LEFT:
        this.move('up');
        break;
      case BTN_CODE.DOWN:
      case BTN_CODE.RIGHT:
        this.move('down');
        break;

      // Enter group or trigger action on item
      case BTN_CODE.A:
        const focused = this.tree[this.focusPath];
        if (focused.type === 'group') {
          this.enterGroup(focused.name);
        }
        if (focused.type === 'item') {
          focused.el.dispatchEvent(new MouseEvent('click'));
        }
        break;

      // Exit group
      case BTN_CODE.B:
        window.csButtonInterceptors = window.csButtonInterceptors?.filter(
          (i) => i.id !== interceptorId
        );
        onExit?.();
        break;
    }

    return true;
  }
}