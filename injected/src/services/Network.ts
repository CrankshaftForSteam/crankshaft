import { rpcRequest } from '../rpc';
import { info } from '../util';
import { Service } from './Service';

export class FetchError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Fetch returned error status code: ${status}`);
    this.status = status;
  }
}

export class Network extends Service {
  async fetch<T>(url: string) {
    info('fetch', url);
    const { data, status } = await rpcRequest<
      { url: string },
      { data: string; status: number }
    >('NetworkService.Fetch', { url });
    if (status !== 200) {
      throw new FetchError(status);
    }

    return JSON.parse(data) as T;
  }
}
