import { rpcRequest } from '../rpc';
import { info } from '../util';
import { Service } from './Service';

export class NetworkGetError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Get returned error status code: ${status}`);
    this.status = status;
  }
}

export class Network extends Service {
  async get<T>(url: string) {
    info('get', url);
    const { data, status } = await rpcRequest<
      { url: string },
      { data: string; status: number }
    >('NetworkService.Get', { url });
    if (status !== 200) {
      throw new NetworkGetError(status);
    }

    return JSON.parse(data) as T;
  }
}
