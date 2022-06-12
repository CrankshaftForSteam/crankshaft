import { rpcRequest } from '../rpc';
import { Entry } from '../SMM';
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

  async injectPlugins(entry: Entry) {
    const { getRes } = rpcRequest<{ entryPoint: Entry }, {}>(
      'InjectService.InjectPlugins',
      { entryPoint: entry }
    );
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

  async remove(pluginId: string) {
    this.unload(pluginId);
    const { getRes } = rpcRequest<{ id: string }, {}>('PluginsService.Remove', {
      id: pluginId,
    });
    return getRes();
  }

  async load(pluginId: string) {
    await this.smm.loadPlugin(pluginId);
    await this.setEnabled(pluginId, true);
  }

  async unload(pluginId: string) {
    await this.smm.unloadPlugin(pluginId);
    await this.setEnabled(pluginId, false);
  }

  async injectPlugin(pluginId: string) {
    const { getRes } = rpcRequest<{ pluginId: string }, {}>(
      'InjectService.InjectPlugin',
      { pluginId }
    );
    return getRes();
  }
}
