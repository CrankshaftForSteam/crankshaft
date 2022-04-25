import { MenuManager } from './menu-manager';
import { FS } from './services/FS';
import { IPC } from './services/IPC';
import { Network } from './services/Network';
import { Plugins } from './services/Plugins';
import { Toast } from './services/Toast';
import { info } from './util';

type PluginId = string;

type AddEventListenerArgs = Parameters<EventTarget['addEventListener']>;

export class SMM extends EventTarget {
  private _currentTab?: 'home' | 'collections' | 'appDetails';
  private _currentAppId?: string;
  private _currentAppName?: string;

  readonly Network: Network;
  readonly Toast: Toast;
  // TODO: improve types for running in context without menu
  readonly MenuManager!: MenuManager;
  readonly FS: FS;
  readonly Plugins: Plugins;
  readonly IPC: IPC;

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

  constructor(entry: 'library' | 'menu') {
    super();

    this._currentTab = undefined;
    this._currentAppId = undefined;
    this._currentAppName = undefined;

    this.Network = new Network(this);
    this.Toast = new Toast(this);
    this.FS = new FS(this);
    this.Plugins = new Plugins(this);
    this.IPC = new IPC(this);

    if (entry === 'library') {
      this.MenuManager = new MenuManager(this);
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

  switchToAppDetails(appId: string, appName: string) {
    if (this._currentTab === 'appDetails' && this._currentAppId === appId) {
      return;
    }

    info('Switched to app details for app', appId);
    this._currentTab = 'appDetails';
    this._currentAppId = appId;
    this._currentAppName = appName;
    this.dispatchEvent(
      new CustomEvent('switchToAppDetails', { detail: { appId, appName } })
    );
  }

  async loadPlugins() {
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
}
