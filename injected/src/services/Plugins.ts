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
  script: string;
  enabled: boolean;
}

export class Plugins extends Service {
  async list() {
    const { getRes } = rpcRequest<{}, { plugins: Plugin[] }>(
      'PluginsService.List',
      {}
    );
    return (await getRes()).plugins;
  }
}
