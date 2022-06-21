export type GamepadTree = Record<string, GamepadTreeChild>;

interface GamepadTreeChild {
  type: 'group' | 'item';
  name: string;
  parentGroup: string;
  el: HTMLElement;
  // If this item should get initial focus
  initialFocus: boolean;
}

export interface GamepadGroup extends GamepadTreeChild {
  type: 'group';
}

export interface GamepadItem extends GamepadTreeChild {
  type: 'item';
}

// Selector for items in the specified group
const selectInGroup = (groupName: string) =>
  `[data-cs-gp-in-group="${groupName}"]`;
// Select group element
const selectGroup = (groupName: string) => `[data-cs-gp-group="${groupName}"]`;

export const buildGamepadTree = (root: HTMLElement): GamepadTree => {
  const children = root.querySelectorAll<HTMLElement>(selectInGroup('root'));

  let tree: GamepadTree = {};

  // TODO: deduplicate
  for (const el of children) {
    if (el.dataset.csGpGroup) {
      const groupName = el.dataset.csGpGroup;
      tree = {
        ...tree,
        ...buildGroup({ root, name: groupName, parentGroup: 'root' }),
      };
      continue;
    }

    if (el.dataset.csGpItem) {
      const itemName = el.dataset.csGpItem;
      tree[itemName] = makeItem(el, 'root');
      continue;
    }
  }

  return tree;
};

const buildGroup = ({
  root,
  name,
  parentGroup,
}: {
  root: HTMLElement;
  name: string;
  parentGroup: string;
}): GamepadTree => {
  const group = makeGroup(
    root.querySelector<HTMLElement>(selectGroup(name))!,
    parentGroup
  );

  const children = root.querySelectorAll<HTMLElement>(selectInGroup(name));

  let tree: GamepadTree = {
    [group.name]: group,
  };

  for (const el of children) {
    if (el.dataset.csGpGroup) {
      const groupName = el.dataset.csGpGroup;
      tree = {
        ...tree,
        ...buildGroup({ root, name: groupName, parentGroup: name }),
      };
      continue;
    }

    if (el.dataset.csGpItem) {
      const itemName = el.dataset.csGpItem;
      tree[itemName] = makeItem(el, name);
      continue;
    }
  }

  return tree;
};

const makeGroup = (el: HTMLElement, parentGroup: string): GamepadGroup => ({
  type: 'group',
  name: el.dataset.csGpGroup!,
  parentGroup,
  el,
  initialFocus: (el.dataset.csGpInitFocus ?? '') === 'true',
});

const makeItem = (el: HTMLElement, parentGroup: string): GamepadItem => ({
  type: 'item',
  name: el.dataset.csGpItem!,
  parentGroup,
  el,
  initialFocus: (el.dataset.csGpInitFocus ?? '') === 'true',
});
