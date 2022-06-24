import { GamepadGroup, GamepadItem, GamepadTree } from '.';
import { selectGroup, selectInGroup } from './utils';

export const buildGamepadTree = (root: HTMLElement): GamepadTree => {
  const children = root.querySelectorAll<HTMLElement>(selectInGroup('root'));

  let tree: GamepadTree = {};

  // TODO: deduplicate
  for (const [indexStr, el] of Object.entries(children)) {
    const index = Number(indexStr);

    if (el.dataset.csGpGroup) {
      const groupName = el.dataset.csGpGroup;
      tree = {
        ...tree,
        ...buildGroup({
          root,
          name: groupName,
          parentGroup: 'root',
          position: index,
        }),
      };
      continue;
    }

    if (el.dataset.csGpItem) {
      const itemName = el.dataset.csGpItem;
      tree[itemName] = makeItem(el, 'root', index);
      continue;
    }
  }

  return tree;
};

const buildGroup = ({
  root,
  name,
  parentGroup,
  position,
}: {
  root: HTMLElement;
  name: string;
  parentGroup: string;
  position: number;
}): GamepadTree => {
  const group = makeGroup(
    root.querySelector<HTMLElement>(selectGroup(name))!,
    parentGroup,
    position
  );

  const children = root.querySelectorAll<HTMLElement>(selectInGroup(name));

  let tree: GamepadTree = {
    [group.name]: group,
  };

  for (const [indexStr, el] of Object.entries(children)) {
    const index = Number(indexStr);

    if (el.dataset.csGpGroup) {
      const groupName = el.dataset.csGpGroup;
      tree = {
        ...tree,
        ...buildGroup({
          root,
          name: groupName,
          parentGroup: name,
          position: index,
        }),
      };
      continue;
    }

    if (el.dataset.csGpItem) {
      const itemName = el.dataset.csGpItem;
      tree[itemName] = makeItem(el, name, index);
      continue;
    }
  }

  return tree;
};

const makeGroup = (
  el: HTMLElement,
  parentGroup: string,
  position: number
): GamepadGroup => ({
  type: 'group',
  name: el.dataset.csGpGroup!,
  parentGroup,
  el,
  initialFocus: (el.dataset.csGpInitFocus ?? '') === 'true',
  position,
});

const makeItem = (
  el: HTMLElement,
  parentGroup: string,
  position: number
): GamepadItem => ({
  type: 'item',
  name: el.dataset.csGpItem!,
  parentGroup,
  el,
  initialFocus: (el.dataset.csGpInitFocus ?? '') === 'true',
  position,
});
