// Selector for items in the specified group
export const selectInGroup = (groupName: string) =>
  `[data-cs-gp-in-group="${groupName}"]`;

// Select group element
export const selectGroup = (groupName: string) =>
  `[data-cs-gp-group="${groupName}"]`;
