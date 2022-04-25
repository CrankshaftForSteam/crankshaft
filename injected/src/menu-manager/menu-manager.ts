import { SMM } from '../SMM';
import { info } from '../util';
import { MenuInjectorDeck } from './menu-injector-deck';
import { MenuInjectorDesktop } from './menu-injector-desktop';

type MenuItemRender = (smm: SMM, root: HTMLElement) => void | Promise<void>;

export interface MenuItem {
  id: string;
  label: string;
  fontSize?: number;
  render: MenuItemRender;
}

export interface MenuInjector {
  createMenuItem: (item: MenuItem) => void;
  removeMenuItem: (id: string) => void;
}

export class MenuManager {
  private smm: SMM;
  // TODO: use a map
  menuItems: MenuItem[];
  private injector!: MenuInjector;

  constructor(smm: SMM) {
    this.smm = smm;
    this.menuItems = [];

    if (window.smmUIMode === 'desktop') {
      info('Injecting MenuManager for desktop library');
      this.injector = new MenuInjectorDesktop(this.smm);
    }

    if (window.smmUIMode === 'deck') {
      info('Injecting MenuManager for Deck menu');
      this.injector = new MenuInjectorDeck(this.smm, this);
    }
  }

  reload() {
    if (window.smmUIMode === 'desktop') {
      info('Injecting MenuManager for desktop library');
      this.injector = new MenuInjectorDesktop(this.smm);
    }

    if (window.smmUIMode === 'deck') {
      info('Injecting MenuManager for Deck menu');
      this.injector = new MenuInjectorDeck(this.smm, this);
    }

    const prevMenuItems = this.menuItems.slice();
    this.menuItems = [];
    for (const item of prevMenuItems) {
      this.addMenuItem(item);
    }
  }

  addMenuItem(item: MenuItem) {
    const newMenuItem = this.injector.createMenuItem(item);
    this.menuItems.push(item);
  }

  removeMenuItem(id: string) {
    this.injector.removeMenuItem(id);

    const index = this.menuItems.findIndex((item) => item.id === id);
    if (index < 0) {
      return;
    }

    this.menuItems.splice(index, 1);
  }
}
