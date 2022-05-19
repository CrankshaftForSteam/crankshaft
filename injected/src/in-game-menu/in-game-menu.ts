import { SMM } from '../SMM';
import { info } from '../util';
import { InGameMenuInjectorDeck } from './in-game-menu-injector-deck';

type InGameMenuRender = (smm: SMM, root: HTMLElement) => void | Promise<void>;

export interface InGameMenuItem {
  id: string;
  title: string;
  render?: InGameMenuRender;
}

export interface InGameMenuInjector {
  createItem: (item: InGameMenuItem) => void;
  removeItem: (id: string) => void;
}

export class InGameMenu {
  private readonly smm: SMM;
  items: InGameMenuItem[];

  private injector!: InGameMenuInjector;

  constructor(smm: SMM) {
    this.smm = smm;
    this.items = [];

    if (window.smmUIMode === 'deck') {
      info('Injecting InGameMenu for Deck quick access');
      this.injector = new InGameMenuInjectorDeck(this.smm, this);
    }
  }

  addMenuItem(item: InGameMenuItem) {
    if (this.smm.entry !== 'quickAccess') {
      throw new Error(
        'Quick access items must be added and removed from quick access entrypoint'
      );
    }

    this._addMenuItem(item);
  }

  _addMenuItem(item: InGameMenuItem) {
    this.injector.createItem(item);
    this.items.push(item);
  }

  removeMenuItem(id: string) {
    if (this.smm.entry !== 'quickAccess') {
      throw new Error(
        'Quick access items must be added and removed from quick access entrypoint'
      );
    }

    this._removeMenuItem(id);
  }

  _removeMenuItem(id: string) {
    this.injector.removeItem(id);

    const index = this.items.findIndex((item) => item.id !== id);
    if (index < 0) {
      return;
    }
    this.items.splice(index, 1);
  }
}
