import { Network } from './services/Network';
import { info } from './util';

export class SMM extends EventTarget {
  private _currentTab?: 'home' | 'collections' | 'appDetails';
  private _currentAppId?: string;

  readonly Network: Network;

  constructor() {
    super();

    this._currentTab = undefined;
    this._currentAppId = undefined;

    this.Network = new Network(this);
  }

  get currentTab() {
    return this._currentTab;
  }

  get currentAppId() {
    return this._currentAppId;
  }

  switchToUnknownPage() {
    if (typeof this._currentTab === 'undefined') {
      return;
    }

    info('Switched to unknown page');
    this._currentTab = undefined;
    this._currentAppId = undefined;
    this.dispatchEvent(new CustomEvent('switchToUnknownPage'));
  }

  switchToHome() {
    if (this._currentTab === 'home') {
      return;
    }

    info('Switched to home');
    this._currentTab = 'home';
    this._currentAppId = undefined;
    this.dispatchEvent(new CustomEvent('switchToHome'));
  }

  switchToCollections() {
    if (this._currentTab === 'collections') {
      return;
    }

    info('Switched to collections');
    this._currentTab = 'collections';
    this._currentAppId = undefined;
    this.dispatchEvent(new CustomEvent('switchToCollections'));
  }

  switchToAppDetails(appId: string) {
    if (this._currentTab === 'appDetails' && this._currentAppId === appId) {
      return;
    }

    info('Switched to app details for app', appId);
    this._currentTab = 'appDetails';
    this._currentAppId = appId;
    this.dispatchEvent(
      new CustomEvent('switchToAppDetails', { detail: { appId } })
    );
  }
}
