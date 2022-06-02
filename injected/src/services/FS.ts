import { rpcRequest } from '../rpc';
import { info } from '../util';
import { Service } from './Service';

export class FS extends Service {
  async listDir(path: string) {
    info('listDir', path);

    const { getRes } = rpcRequest<
      { path: string },
      {
        contents: {
          name: string;
          isDir: boolean;
        }[];
      }
    >('FSService.ListDir', { path });

    return (await getRes()).contents;
  }

  async mkDir(path: string, parents: boolean = false) {
    info('mkDir', path, parents);

    const { getRes } = rpcRequest<{ path: string; parents: boolean }, {}>(
      'FSService.MkDir',
      { path, parents }
    );
    return getRes();
  }

  async readFile(path: string) {
    info('readFile', path);

    const { getRes } = rpcRequest<
      { path: string },
      {
        data: string;
      }
    >('FSService.ReadFile', { path });

    return (await getRes()).data.trim();
  }

  untar(tarPath: string, destPath: string) {
    info('untar', { tarPath, destPath });

    return rpcRequest<{ tarPath: string; destPath: string }, void>(
      'FSService.Untar',
      { tarPath, destPath }
    );
  }

  async getPluginsPath() {
    const { getRes } = rpcRequest<{}, { path: string }>(
      'FSService.GetPluginsPath',
      {}
    );
    return (await getRes()).path;
  }
}
