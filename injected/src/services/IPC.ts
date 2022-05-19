import { rpcRequest } from '../rpc';
import { Service } from './Service';

type Handler<T extends any> = (event: { name: string; data: T }) => void;

export class IPC extends Service {
  private readonly ws: WebSocket;
  private listeners: Record<string, Handler<any>[]>;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);

    this.ws = new WebSocket(`ws://localhost:${window.smmServerPort}/ws`);
    this.listeners = {};

    this.ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (this.listeners[data.name]) {
        for (const listener of this.listeners[data.name]) {
          listener(data);
        }
      }
    };
  }

  async send<T extends any>(name: string, data: T) {
    const { getRes } = rpcRequest<{ message: string }, {}>('IPCService.Send', {
      message: JSON.stringify({
        name,
        data,
      }),
    });
    return getRes();
  }

  on<Data extends any>(name: string, handler: Handler<Data>) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }
    this.listeners[name].push(handler);
  }

  off(name: string) {
    this.listeners[name] = [];
  }
}
