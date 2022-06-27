import { SMM } from '../smm';
import { shouldAllowButtonPress } from './overrides';

type buttonInterceptor = Exclude<
  typeof window['csButtonInterceptors'],
  undefined
>[number];

enum ipcNames {
  addInterceptor = 'csButtonInterceptorsAddInterceptor',
  interceptorTriggered = 'csButtonInterceptorsInterceptorTriggered',
  removeInterceptor = 'csButtonInterceptorsRemoveInterceptor',
}

interface ipcAddInterceptor {
  id: string;
}

interface ipcInterceptorTriggered {
  buttonCode: number;
}

interface ipcRemoveInterceptor {
  id: string;
}

export class ButtonInterceptors {
  private smm: SMM;

  constructor(smm: SMM) {
    this.smm = smm;

    window.csButtonInterceptors ||= [];

    if (this.smm.entry === 'library') {
      this.smm.IPC.on<ipcAddInterceptor>(
        ipcNames.addInterceptor,
        ({ data: { id } }) => {
          window.csButtonInterceptors?.push({
            id,
            handler: (buttonCode: number) => {
              if (shouldAllowButtonPress(buttonCode)) {
                return false;
              }

              this.smm.IPC.send<ipcInterceptorTriggered>(
                `${ipcNames.interceptorTriggered}-${id}`,
                { buttonCode }
              );
              return true;
            },
          });
        }
      );

      this.smm.IPC.on<ipcRemoveInterceptor>(
        ipcNames.removeInterceptor,
        ({ data: { id } }) => {
          window.csButtonInterceptors = window.csButtonInterceptors?.filter(
            (i) => i.id !== id
          );
        }
      );
    }
  }

  async addInterceptor({ id, handler }: buttonInterceptor) {
    window.csButtonInterceptors ||= [];
    window.csButtonInterceptors.push({
      id,
      handler: (buttonCode: number) => {
        if (shouldAllowButtonPress(buttonCode)) {
          return false;
        }
        handler(buttonCode);
        return true;
      },
    });

    if (this.smm.entry !== 'library') {
      this.smm.IPC.on<ipcInterceptorTriggered>(
        `${ipcNames.interceptorTriggered}-${id}`,
        ({ data: { buttonCode } }) => {
          window.csButtonInterceptors
            ?.find((i) => i.id === id)
            ?.handler(buttonCode);
        }
      );

      await this.smm.IPC.send<ipcAddInterceptor>(ipcNames.addInterceptor, {
        id,
      });
    }
  }

  async removeInterceptor(id: string) {
    window.csButtonInterceptors = window.csButtonInterceptors?.filter(
      (i) => i.id !== id
    );
    if (this.smm.entry !== 'library') {
      this.smm.IPC.send<ipcRemoveInterceptor>(ipcNames.removeInterceptor, {
        id,
      });
    }
  }
}
