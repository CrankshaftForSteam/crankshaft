import { info } from '../util';
import { MenuInjectorDeck } from './menu-injector-deck';
import { MenuInjectorDesktop } from './menu-injector-desktop';

interface MenuItem {
  id: string;
  label: string;
  fontSize?: number;
  node: HTMLElement;
}

export interface MenuInjector<MenuItemType extends HTMLElement> {
  createMenuItem: (props: { label: string; fontSize?: number }) => MenuItemType;
}

export class MenuManager {
  private entry: 'library' | 'menu';
  private menuItems: MenuItem[];
  private injector!: MenuInjector<HTMLElement>;

  constructor(entry: 'library' | 'menu') {
    this.entry = entry;
    this.menuItems = [];

    if (entry === 'library' && window.smmUIMode === 'desktop') {
      info('Injecting MenuManager for desktop library');
      this.injector = new MenuInjectorDesktop();
    }

    if (entry === 'menu' && window.smmUIMode === 'deck') {
      info('Injecting MenuManager for Deck menu');
      this.injector = new MenuInjectorDeck();
    }
  }

  addMenuItem(
    item: Omit<MenuItem, 'node'>,
    onClick: (event: MouseEvent) => void
  ) {
    const newMenuItem = this.injector.createMenuItem(item);
    newMenuItem.dataset.smmMenuItem = item.id;

    newMenuItem.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick(event);
    });

    this.menuItems.push({ ...item, node: newMenuItem });
  }

  removeMenuItem(id: string) {
    const index = this.menuItems.findIndex((item) => item.id === id);
    this.menuItems[index].node.remove();
    this.menuItems.splice(index, 1);
  }
}
