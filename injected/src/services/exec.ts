import { rpcRequest } from '../rpc';
import { Service } from './service';

export class Exec extends Service {
  async run(command: string, args: string[]) {
    const { getRes } = rpcRequest<
      {
        command: string;
        args: string[];
      },
      {
        exitCode: number;
        stdout: string;
        stderr: string;
      }
    >('ExecService.Run', { command, args });
    return getRes();
  }

  async start(command: string, args: string[]) {
    const { getRes } = rpcRequest<
      {
        command: string;
        args: string[];
      },
      {
        pid: number;
      }
    >('ExecService.Start', { command, args });
    return getRes();
  }

  async stop(pid: number, kill: boolean = false) {
    const { getRes } = rpcRequest<
      {
        pid: number;
        kill: boolean;
      },
      {
        exitCode: number;
        stdout: string;
        stderr: string;
      }
    >('ExecService.Stop', { pid, kill });
    return getRes();
  }
}
