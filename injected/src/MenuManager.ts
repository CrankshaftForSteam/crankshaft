import { DECK_SELECTORS } from './selectors';
import { deleteAll } from './util';

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  node: HTMLDivElement;
}

export class MenuManager {
  private menuItems: MenuItem[];

  private menuContainer!: HTMLDivElement;
  private menuItemTemplate!: HTMLDivElement;

  private icons!: Record<string, HTMLDivElement>;

  constructor() {
    this.menuItems = [];
    this.inject();
  }

  inject() {
    deleteAll('[data-smm-menu-item-style]');
    deleteAll('[data-smm-menu-item]');

    this.menuContainer = document.querySelector<HTMLDivElement>(
      DECK_SELECTORS.menuContainer
    )!;

    // Find first non-active item
    let menuItem = this.menuContainer.childNodes[0] as HTMLDivElement;
    for (const _node of this.menuContainer.childNodes) {
      const node = _node as HTMLDivElement;

      if (node.querySelector(DECK_SELECTORS.menuItemActive)) {
        continue;
      }

      menuItem = node;
      break;
    }
    const menuItemClass = Array.from(menuItem.classList).find((c) =>
      /^mainmenu_ItemOuter_/.exec(c)
    );

    // Make the menu scroll
    this.menuContainer.style.overflow = 'scroll';
    this.menuContainer.style.justifyContent = 'unset';
    const menuItemStyle = document.createElement('style');
    menuItemStyle.dataset.smmMenuItemStyle = '';
    menuItemStyle.innerHTML = `.${menuItemClass} { flex-shrink: 0 !important; }`;
    document.querySelector('head')?.appendChild(menuItemStyle);

    this.menuItemTemplate = document.importNode(
      menuItem,
      true
    ) as HTMLDivElement;

    // Get icons
    this.icons = {};
    document.querySelectorAll(DECK_SELECTORS.menuItem).forEach((item) => {
      const name = item
        .querySelector(DECK_SELECTORS.menuItemLabel)!
        .textContent!.toLowerCase();
      const icon = document.importNode<HTMLDivElement>(
        item.querySelector(DECK_SELECTORS.menuItemIcon)!,
        true
      );
      this.icons[name] = icon;
    });
  }

  addMenuItem(
    item: Omit<MenuItem, 'node'>,
    onClick: (event: MouseEvent) => void
  ) {
    const newMenuItem = document.importNode(
      this.menuItemTemplate,
      true
    ) as HTMLDivElement;
    newMenuItem.dataset.smmMenuItem = item.id;
    newMenuItem.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick(event);
    });

    let label = newMenuItem.querySelector<HTMLDivElement>(
      DECK_SELECTORS.menuItemLabel
    )!;
    label.innerHTML = item.label;

    if (item.icon) {
      newMenuItem.querySelector(DECK_SELECTORS.menuItemIcon)?.remove();
      (newMenuItem.childNodes[0] as HTMLDivElement).prepend(
        document.importNode(this.icons[item.icon], true)
      );
    }

    this.menuContainer.appendChild(newMenuItem);

    this.menuItems.push({ ...item, node: newMenuItem });
  }

  removeMenuItem(id: string) {
    const index = this.menuItems.findIndex((item) => item.id === id);
    this.menuItems[index].node.remove();
    this.menuItems.splice(index, 1);
  }
}
