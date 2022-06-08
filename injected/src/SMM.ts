import { InGameMenu } from './in-game-menu';
import { MenuManager } from './menu-manager';
import { Exec } from './services/Exec';
import { FS } from './services/FS';
import { Inject } from './services/Inject';
import { IPC } from './services/IPC';
import { Network } from './services/Network';
import { Plugins } from './services/Plugins';
import { Toast } from './services/Toast';
import { UI } from './services/ui';
import { info } from './util';

type PluginId = string;

type AddEventListenerArgs = Parameters<EventTarget['addEventListener']>;

type SMMEvent =
  | EventSwitchToUnknownPage
  | EventSwitchToHome
  | EventSwitchToCollections
  | EventSwitchToAppDetails
  | EventLockScreenOpened
  | EventLockScreenClosed;

class EventSwitchToUnknownPage extends CustomEvent<void> {
  constructor() {
    super('switchToUnknownPage');
  }
}

class EventSwitchToHome extends CustomEvent<void> {
  constructor() {
    super('switchToHome');
  }
}

class EventSwitchToCollections extends CustomEvent<void> {
  constructor() {
    super('switchToCollections');
  }
}

type eventDetailsSwitchToAppDetails = { appId: string; appName: string };
class EventSwitchToAppDetails extends CustomEvent<eventDetailsSwitchToAppDetails> {
  constructor(detail: eventDetailsSwitchToAppDetails) {
    super('switchToAppDetails', { detail });
  }
}

class EventLockScreenOpened extends CustomEvent<void> {
  constructor() {
    super('lockScreenOpened');
  }
}

class EventLockScreenClosed extends CustomEvent<void> {
  constructor() {
    super('lockScreenClosed');
  }
}

export type Entry = 'library' | 'menu' | 'quickAccess' | 'appProperties';

export class SMM extends EventTarget {
  readonly entry: Entry;

  private _currentTab?: 'home' | 'collections' | 'appDetails';
  private _currentAppId?: string;
  private _currentAppName?: string;
  private _onLockScreen: boolean;

  readonly Network: Network;
  readonly Toast: Toast;
  // TODO: improve types for running in context without menu
  readonly MenuManager!: MenuManager;
  readonly InGameMenu!: InGameMenu;
  readonly FS: FS;
  readonly Plugins: Plugins;
  readonly IPC: IPC;
  readonly UI: UI;
  readonly Exec: Exec;
  readonly Inject: Inject;

  readonly serverPort: string;

  // The current plugin that we're loading
  // This is set before calling a plugin's load method, so that we can keep
  // track of which events the plugin attaches, and remove them when we unload
  // that plugin.
  private currentPlugin?: string;
  // Events attached by plugins
  private attachedEvents: Record<
    PluginId,
    {
      type: AddEventListenerArgs[0];
      callback: AddEventListenerArgs[1];
      options: AddEventListenerArgs[2];
    }[]
  >;

  constructor(entry: Entry) {
    super();

    this.entry = entry;

    this._currentTab = undefined;
    this._currentAppId = undefined;
    this._currentAppName = undefined;
    this._onLockScreen = false;

    this.Network = new Network(this);
    this.Toast = new Toast(this);
    this.FS = new FS(this);
    this.Plugins = new Plugins(this);
    this.IPC = new IPC(this);
    this.UI = new UI(this);
    this.Exec = new Exec(this);
    this.Inject = new Inject(this);

    if (entry === 'library') {
      this.MenuManager = new MenuManager(this);
    }

    if (entry === 'library' || entry === 'quickAccess') {
      this.InGameMenu = new InGameMenu(this);
    }

    this.serverPort = window.smmServerPort;

    this.attachedEvents = {};
  }

  get currentTab() {
    return this._currentTab;
  }

  get currentAppId() {
    return this._currentAppId;
  }

  get onLockScreen() {
    return this._onLockScreen;
  }

  switchToUnknownPage() {
    if (typeof this._currentTab === 'undefined') {
      return;
    }

    info('Switched to unknown page');
    this._currentTab = undefined;
    this._currentAppId = undefined;
    this.dispatchEvent(new EventSwitchToUnknownPage());
  }

  switchToHome() {
    if (this._currentTab === 'home') {
      return;
    }

    info('Switched to home');
    this._currentTab = 'home';
    this._currentAppId = undefined;
    this.dispatchEvent(new EventSwitchToHome());
  }

  switchToCollections() {
    if (this._currentTab === 'collections') {
      return;
    }

    info('Switched to collections');
    this._currentTab = 'collections';
    this._currentAppId = undefined;
    this.dispatchEvent(new EventSwitchToCollections());
  }

  switchToAppDetails(appId: string, appName: string) {
    if (this._currentTab === 'appDetails' && this._currentAppId === appId) {
      return;
    }

    info('Switched to app details for app', appId);
    this._currentTab = 'appDetails';
    this._currentAppId = appId;
    this._currentAppName = appName;
    this.dispatchEvent(new EventSwitchToAppDetails({ appId, appName }));
  }

  switchToAppProperties(appId: string, appName: string) {
    info('Switched to app properties for app', appId);
    this.dispatchEvent(new EventSwitchToAppProperties({ appId, appName }));
  }

  lockScreenOpened() {
    if (this._onLockScreen) {
      return;
    }

    info('Lock screen opened');
    this._onLockScreen = true;
    this.dispatchEvent(new EventLockScreenOpened());
  }

  lockScreenClosed() {
    if (!this._onLockScreen) {
      return;
    }

    info('Lock screen closed');
    this._onLockScreen = false;
    this.dispatchEvent(new EventLockScreenClosed());
  }

  async loadPlugins() {
    info('Loading plugins...');

    // Inject plugins
    // TODO: this will inject plugins into all contexts, but we don't know if
    // other contexts have loaded yet
    try {
      await new Promise<void>((resolve) => {
        // This will be called once the server has loaded plugins
        window.csPluginsLoaded = resolve;

        info('Calling InjectService.InjectPlugins...');
        this.Plugins.injectPlugins(this.entry);
      });
    } catch (err) {
      this.Toast.addToast(`Error injecting plugins: ${err}`, 'error');
    }

    const plugins = await this.Plugins.list();

    info('loadPlugins: ', { plugins, smmPlugins: window.smmPlugins });

    // It's probably better to load these sequentially
    for (const [name, { load, unload }] of Object.entries(
      window.smmPlugins ?? {}
    )) {
      if (plugins[name]?.enabled) {
        await this.loadPlugin(name);
      }
    }
  }

  async loadPlugin(pluginId: PluginId) {
    await this.unloadPlugin(pluginId);

    if (!window.smmPlugins?.[pluginId]) {
      return;
    }

    info(`Loading plugin ${name}...`);
    this.currentPlugin = pluginId;
    await window.smmPlugins[pluginId].load(this);
    this.currentPlugin = undefined;
  }

  async unloadPlugin(pluginId: PluginId) {
    if (!window.smmPlugins) {
      return;
    }

    info(`Unloading plugin ${pluginId}...`);
    await window.smmPlugins[pluginId]?.unload?.(this);

    if (this.attachedEvents[pluginId]) {
      for (const { type, callback, options } of this.attachedEvents[pluginId]) {
        this.removeEventListener(type, callback, options);
      }
      delete this.attachedEvents[pluginId];
    }
  }

  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (!this.currentPlugin) {
      console.error('[SMM] addEventListener missing this.currentPlugin!');
      return;
    }

    if (!this.attachedEvents[this.currentPlugin]) {
      this.attachedEvents[this.currentPlugin] = [];
    }

    this.attachedEvents[this.currentPlugin].push({ type, callback, options });
    super.addEventListener(type, callback, options);
  }

  dispatchEvent(event: SMMEvent): boolean {
    return super.dispatchEvent(event);
  }
}
