import { rpcRequest } from '../rpc';
import { AppPropsApp } from '../types/global';
import { Service } from './service';

export class Inject extends Service {
  async injectAppProperties(app: AppPropsApp, title: string) {
    const { getRes } = rpcRequest<
      {
        app: string;
        title: string;
      },
      {}
    >('InjectService.InjectAppProperties', { app: JSON.stringify(app), title });
    return getRes();
  }
}
