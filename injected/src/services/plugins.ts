import { rpcRequest } from '../rpc';
import { Entry } from '../smm';
import { Service } from './service';

interface Entrypoint {
  library: boolean;
  menu: boolean;
}

export interface Plugin {
  id: string;
  dir: string;
  config: {
    name: string;
    version: string;
    link: string;
    source: string;

    author: {
      name: string;
      link: string;
    };

    entrypoints: {
      desktop: Entrypoint;
      deck: Entrypoint;
    };

    store: {
      description?: string;
    };
  };
  enabled: boolean;
}

enum ipcNames {
  load = 'csPluginsLoad',
  unload = 'csPluginsUnload',
  injectPlugin = 'csPluginsInjectPlugin',
  reloadPlugin = 'csPluginsReloadPlugin',
}

interface PluginsIPCData {
  entrypoint: Entry;
  pluginId: string;
}

export class Plugins extends Service {
  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);

    this.attachIPCListeners();
  }

  private attachIPCListeners() {
    const ipcMethods = {
      [ipcNames.load]: '_load',
      [ipcNames.unload]: '_unload',
      [ipcNames.injectPlugin]: '_injectPlugin',
      [ipcNames.reloadPlugin]: '_reloadPlugin',
    } as const;

    for (const [ipcName, method] of Object.entries(ipcMethods)) {
      this.smm.IPC.on<PluginsIPCData>(
        ipcName,
        ({ data: { entrypoint, pluginId } }) => {
          if (this.smm.entry === entrypoint) {
            return;
          }
          this[method](pluginId);
        }
      );
    }
  }

  async list() {
    const { getRes } = rpcRequest<{}, { plugins: Record<string, Plugin> }>(
      'PluginsService.List',
      {}
    );
    return (await getRes()).plugins;
  }

  async injectPlugins(entry: Entry) {
    const { getRes } = rpcRequest<{ entryPoint: Entry; title: string }, {}>(
      'InjectService.InjectPlugins',
      { entryPoint: entry, title: document.title }
    );
    return getRes();
  }

  async setEnabled(id: string, enabled: boolean) {
    const { getRes } = rpcRequest<{ id: string; enabled: boolean }, {}>(
      'PluginsService.SetEnabled',
      { id, enabled }
    );
    return getRes();
  }

  async remove(pluginId: string) {
    this.unload(pluginId);
    const { getRes } = rpcRequest<{ id: string }, {}>('PluginsService.Remove', {
      id: pluginId,
    });
    return getRes();
  }

  private async _load(pluginId: string) {
    // If the plugin hasn't been injected, attempt to inject it
    if (!window.smmPlugins?.[pluginId]) {
      await this._injectPlugin(pluginId);
    }
    
    await this.smm.loadPlugin(pluginId);
  }

  async load(pluginId: string) {
    this.smm.IPC.send<PluginsIPCData>(ipcNames.load, {
      entrypoint: this.smm.entry,
      pluginId,
    });

    await this.setEnabled(pluginId, true);
    return this._load(pluginId);
  }

  private async _unload(pluginId: string) {
    await this.smm.unloadPlugin(pluginId);
  }

  async unload(pluginId: string) {
    this.smm.IPC.send<PluginsIPCData>(ipcNames.unload, {
      entrypoint: this.smm.entry,
      pluginId,
    });
    await this.setEnabled(pluginId, false);
    return this._unload(pluginId);
  }

  private async _injectPlugin(pluginId: string) {
    const { getRes } = rpcRequest<
      { pluginId: string; entrypoint: Entry; title: string },
      {}
    >('InjectService.InjectPlugin', {
      pluginId,
      entrypoint: this.smm.entry,
      title: document.title,
    });
    return getRes();
  }

  async injectPlugin(pluginId: string) {
    this.smm.IPC.send<PluginsIPCData>(ipcNames.injectPlugin, {
      entrypoint: this.smm.entry,
      pluginId,
    });
    return this._injectPlugin(pluginId);
  }

  private async _reloadPlugin(pluginId: string) {
    await this.smm.unloadPlugin(pluginId);
    await this._injectPlugin(pluginId);
    await this.smm.loadPlugin(pluginId);
  }

  async reloadPlugin(pluginId: string) {
    this.smm.IPC.send<PluginsIPCData>(ipcNames.reloadPlugin, {
      entrypoint: this.smm.entry,
      pluginId,
    });
    return this._reloadPlugin(pluginId);
  }

  async rebuildPlugin(pluginId: string) {
    const { getRes: rebuildGetRes } = rpcRequest<{ id: string }, {}>(
      'PluginsService.Rebuild',
      { id: pluginId }
    );
    await rebuildGetRes();
  }

  async reloadPlugins() {
    const { getRes } = rpcRequest<{}, {}>('PluginsService.Reload', {});

    await getRes();
  }
}
