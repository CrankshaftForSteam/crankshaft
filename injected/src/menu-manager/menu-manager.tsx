import { SMM } from '../SMM';
import { info } from '../util';
import { MenuInjectorDeck } from './menu-injector-deck';
import { MenuInjectorDesktop } from './menu-injector-desktop';

type MenuItemRender = (smm: SMM, root: HTMLElement) => void | Promise<void>;

interface MenuItem {
  id: string;
  label: string;
  fontSize?: number;
  node: HTMLElement;
  render: MenuItemRender;
}

export interface MenuInjector<MenuItemType extends HTMLElement> {
  createMenuItem: (props: Omit<MenuItem, 'node'>) => MenuItemType;
  getRootForMenuItem: (id: string) => HTMLElement;
  isLoaded: () => boolean;
}

export class MenuManager {
  private smm: SMM;
  private entry: 'library' | 'menu';
  private menuItems: MenuItem[];
  private injector!: MenuInjector<HTMLElement>;

  constructor(smm: SMM, entry: 'library' | 'menu') {
    this.smm = smm;
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

    window.addEventListener('focus', () => {
      if (!this.injector.isLoaded()) {
        this.reload();
      }
    });
  }

  reload() {
    if (this.entry === 'library' && window.smmUIMode === 'desktop') {
      info('Injecting MenuManager for desktop library');
      this.injector = new MenuInjectorDesktop();
    }

    if (this.entry === 'menu' && window.smmUIMode === 'deck') {
      info('Injecting MenuManager for Deck menu');
      this.injector = new MenuInjectorDeck();
    }

    const prevMenuItems = this.menuItems.slice();
    this.menuItems = [];
    for (const item of prevMenuItems) {
      this.addMenuItem(item);
    }
  }

  addMenuItem(item: Omit<MenuItem, 'node'>) {
    const newMenuItem = this.injector.createMenuItem(item);
    newMenuItem.dataset.smmMenuItem = item.id;

    newMenuItem.addEventListener('click', async (event) => {
      event.stopPropagation();
      const root = this.injector.getRootForMenuItem(item.id);
      await item.render(this.smm, root);
    });

    this.menuItems.push({ ...item, node: newMenuItem });
  }

  removeMenuItem(id: string) {
    const index = this.menuItems.findIndex((item) => item.id === id);
    if (index < 0) {
      return;
    }
    this.menuItems[index].node.remove();
    this.menuItems.splice(index, 1);
  }
}
