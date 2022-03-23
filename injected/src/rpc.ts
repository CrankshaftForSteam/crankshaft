import { uuidv4 } from './util';

export const rpcRequest = async <Params, Response>(
  method: string,
  params: Params
) => {
  const controller = new AbortController();
  const cancel = () => controller.abort();

  const res = await fetch(`http://localhost:${window.smmServerPort}/rpc`, {
    signal: controller.signal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method,
      params: [params],
      id: uuidv4(),
    }),
  });

  if (res.status !== 200) {
    throw new Error();
  }

  return {
    res: (await res.json()).result as Response,
    cancel,
  };
};
