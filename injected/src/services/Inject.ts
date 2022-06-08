import { rpcRequest } from '../rpc';
import { Service } from './Service';

export class Inject extends Service {
  async injectAppProperties() {
    const { getRes } = rpcRequest<{}, {}>(
      'InjectService.InjectAppProperties',
      {}
    );
    return getRes();
  }
}
