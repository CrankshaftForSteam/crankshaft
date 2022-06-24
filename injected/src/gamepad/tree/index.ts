export type GamepadTree = Record<string, GamepadTreeChild>;

export interface GamepadTreeChild {
  type: 'group' | 'item';
  name: string;
  parentGroup: string;
  el: HTMLElement;
  position: number;
  // If this item should get initial focus
  initialFocus: boolean;
}

export interface GamepadGroup extends GamepadTreeChild {
  type: 'group';
}

export interface GamepadItem extends GamepadTreeChild {
  type: 'item';
}

export * from './build-tree';
export * from './utils';
