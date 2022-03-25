import { rpcRequest, RpcRequestCancelledError } from '../rpc';
import { info, uuidv4 } from '../util';
import { Service } from './Service';

export class NetworkGetError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Get returned error status code: ${status}`);
    this.status = status;
  }
}

export class NetworkDownloadCancelledError extends Error {
  constructor() {
    super('Download cancelled');
  }
}

export class NetworkDownloadTimeoutError extends Error {
  constructor() {
    super('Download timed out');
  }
}

export interface DownloadProgress {
  finalSizeBytes: number;
  progressBytes: number;
  progressPercent: number;
}

interface DownloadArgs {
  url: string;
  path: string;
  id: string;
  timeoutSeconds: number;
}

export class Network extends Service {
  async get<T>(url: string) {
    info('get', url);

    const { getRes } = rpcRequest<
      { url: string },
      { data: string; status: number }
    >('NetworkService.Get', { url });

    const { data, status } = await getRes();

    if (status !== 200) {
      throw new NetworkGetError(status);
    }

    return JSON.parse(data) as T;
  }

  download({
    url,
    path,
    timeoutSeconds,
    progressCallback,
    checkProgressInterval = 500,
  }: Omit<DownloadArgs, 'id'> & {
    progressCallback?: (progress: DownloadProgress) => void;
    checkProgressInterval?: number;
  }) {
    info('download', url, path);

    const id = uuidv4();

    const { cancel, getRes } = rpcRequest<
      DownloadArgs,
      { status: 'success' | 'timeout' }
    >('NetworkService.Download', {
      url,
      path,
      id,
      timeoutSeconds,
    });

    const download = async () => {
      const checkProgress = async () => {
        if (!progressCallback) {
          return;
        }

        try {
          const progress = await this.checkDownloadProgress(id);
          progressCallback?.(progress);
        } catch {
          // i sure hope this doesn't happen
        }
      };

      const progressInterval = setInterval(
        checkProgress,
        checkProgressInterval
      );

      try {
        const { status } = await getRes();
        if (status === 'timeout') {
          throw new NetworkDownloadTimeoutError();
        }
        return;
      } catch (err) {
        if (err instanceof RpcRequestCancelledError) {
          throw new NetworkDownloadCancelledError();
        }
        throw err;
      } finally {
        clearInterval(progressInterval);
      }
    };

    return { cancel, download, id };
  }

  checkDownloadProgress(id: string) {
    const { getRes } = rpcRequest<{ id: string }, DownloadProgress>(
      'NetworkService.CheckDownloadProgress',
      {
        id,
      }
    );

    return getRes();
  }
}
