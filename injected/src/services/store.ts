import { rpcRequest } from '../rpc';
import { Service } from './Service';

export class Store extends Service {
  async get(pluginId: string, key: string) {
    const { getRes } = rpcRequest<
      { bucket: string; key: string },
      { value: string }
    >('StoreService.Get', {
      bucket: pluginId,
      key,
    });

    return (await getRes()).value;
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
