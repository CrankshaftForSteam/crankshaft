import { rpcRequest } from '../rpc';
import { Service } from './Service';

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
  };
  enabled: boolean;
}

export class Plugins extends Service {
  async list() {
    const { getRes } = rpcRequest<{}, { plugins: Record<string, Plugin> }>(
      'PluginsService.List',
      {}
    );
    return (await getRes()).plugins;
  }

  async injectPlugins() {
    const { getRes } = rpcRequest<{}, {}>('InjectService.InjectPlugins', {});
    return getRes();
  }

  async setEnabled(id: string, enabled: boolean) {
    console.info('setEnabled', id, enabled);
    const { getRes } = rpcRequest<{ id: string; enabled: boolean }, {}>(
      'PluginsService.SetEnabled',
      { id, enabled }
    );
    return getRes();
  }

  async load(pluginName: string) {
    await this.smm.loadPlugin(pluginName);
    await this.setEnabled(pluginName, true);
  }

  async unload(pluginName: string) {
    await this.smm.unloadPlugin(pluginName);
    await this.setEnabled(pluginName, false);
  }

  async injectPlugin(pluginId: string) {
    const { getRes } = rpcRequest<{ pluginId: string }, {}>(
      'InjectService.InjectPlugin',
      { pluginId }
    );
    return getRes();
  }
}
