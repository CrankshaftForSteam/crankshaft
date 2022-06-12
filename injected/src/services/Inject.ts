import { rpcRequest } from '../rpc';
import { Service } from './Service';

export class Inject extends Service {
  async injectAppProperties(appId: number) {
    const { getRes } = rpcRequest<
      {
        appId: number;
      },
      {}
    >('InjectService.InjectAppProperties', { appId });
    return getRes();
  }
}
