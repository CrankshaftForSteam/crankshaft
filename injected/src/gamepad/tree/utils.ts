import { GamepadTreeChild } from '.';

// Selector for items in the specified group
export const selectInGroup = (groupName: string) =>
  `[data-cs-gp-in-group="${groupName}"]`;

// Select group element
export const selectGroup = (groupName: string) =>
  `[data-cs-gp-group="${groupName}"]`;

// Callback for finding children of the specified group
export const children = (parentGroup: string) => (child: GamepadTreeChild) =>
  child.parentGroup === parentGroup;

// Callback for finding siblings of the specified child
export const siblings = (child: GamepadTreeChild) =>
  children(child.parentGroup);
