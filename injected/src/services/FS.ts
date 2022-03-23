import { rpcRequest } from '../rpc';
import { info } from '../util';
import { Service } from './Service';

export class FS extends Service {
  async listDir(path: string) {
    info('listDir', path);
    const { contents } = await rpcRequest<
      { path: string },
      {
        contents: {
          name: string;
          isDir: boolean;
        }[];
      }
    >('FSService.ListDir', { path });
    return contents;
  }

  async readFile(path: string) {
    info('readFile', path);
    const { data } = await rpcRequest<
      { path: string },
      {
        data: string;
      }
    >('FSService.ReadFile', { path });
    return data.trim();
  }

  async untar(tarPath: string, destPath: string) {
    info('untar', { tarPath, destPath });

    return rpcRequest<{ tarPath: string; destPath: string }, void>(
      'FSService.Untar',
      { tarPath, destPath }
    );
  }
}
