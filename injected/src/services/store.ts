import { rpcRequest } from '../rpc';
import { Service } from './service';

export class Store extends Service {
  async get(pluginId: string, key: string) {
    const { getRes } = rpcRequest<
      { bucket: string; key: string },
      { found: boolean; value: string }
    >('StoreService.Get', {
      bucket: pluginId,
      key,
    });

    const res = await getRes();

    if (res.found) {
      return res.value;
    }

    return undefined;
  }

  async set(pluginId: string, key: string, value: string) {
    const { getRes } = rpcRequest<
      {
        bucket: string;
        key: string;
        value: string;
      },
      {}
    >('StoreService.Set', { bucket: pluginId, key, value });

    return getRes();
  }
}
