import { uuidv4 } from './util';

export class RpcRequestError extends Error {
  readonly status?: number;
  constructor(status?: number) {
    let msg = 'RPC request failed';
    if (status) {
      msg += ` with status code: ${status}`;
    }
    super(msg);

    this.status = status;
  }
}

export class RpcRequestCancelledError extends Error {
  constructor() {
    super('RPC request cancelled');
  }
}

export const rpcRequest = <Params, Response>(
  method: string,
  params: Params
) => {
  const controller = new AbortController();
  const cancel = () => controller.abort();

  const getRes = async (): Promise<Response> => {
    try {
      const res = await fetch(`http://localhost:${window.smmServerPort}/rpc`, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cs-Auth': window.csAuthToken,
        },
        body: JSON.stringify({
          method,
          params: [params],
          id: uuidv4(),
        }),
      });

      if (!res.ok) {
        throw new RpcRequestError(res.status);
      }

      return (await res.json()).result;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new RpcRequestCancelledError();
      }
      throw new RpcRequestError();
    }
  };

  return {
    getRes,
    cancel,
  };
};
