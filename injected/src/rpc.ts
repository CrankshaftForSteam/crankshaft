import { uuidv4 } from './util';

export const rpcRequest = async <Params, Response>(
  method: string,
  params: Params
) => {
  const res = await fetch(`http://localhost:${window.smmServerPort}/rpc`, {
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

  return (await res.json()).result as Response;
};
