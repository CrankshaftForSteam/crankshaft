import { rpcRequest } from '../rpc';
import { AppPropsApp } from '../types/global';
import { Service } from './service';

export class Inject extends Service {
  async injectAppProperties(app: AppPropsApp) {
    const { getRes } = rpcRequest<
      {
        app: string;
      },
      {}
    >('InjectService.InjectAppProperties', { app: JSON.stringify(app) });
    return getRes();
  }
}
