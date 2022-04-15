import { rpcRequest } from '../rpc';
import { Service } from './Service';

interface Entrypoint {
  library: boolean;
  menu: boolean;
}

interface Plugin {
  id: string;
  dir: string;
  config: {
    name: string;
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

  async load(pluginName: string) {
    await this.smm.loadPlugin(pluginName);
  }

  async unload(pluginName: string) {
    await this.smm.unloadPlugin(pluginName);
  }
}
