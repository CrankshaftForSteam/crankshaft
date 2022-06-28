import { Entry, SMM } from '../smm';
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
  buttonFilters?: number[];
  entry: Entry;
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
        ({ data: { id, buttonFilters, entry } }) => {
          window.csButtonInterceptors?.push({
            id,
            handler: (buttonCode: number) => {
              if (shouldAllowButtonPress(buttonCode, entry)) {
                return false;
              }

              if (buttonFilters && !buttonFilters.includes(buttonCode)) {
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

  async addInterceptor({
    id,
    handler,
    buttonFilters,
  }: buttonInterceptor & { buttonFilters?: number[] }) {
    window.csButtonInterceptors ||= [];
    window.csButtonInterceptors.push({
      id,
      handler: (buttonCode: number) => {
        if (this.smm.entry === 'library') {
          if (shouldAllowButtonPress(buttonCode, this.smm.entry)) {
            return false;
          }

          if (buttonFilters && buttonFilters.includes(buttonCode)) {
            return false;
          }
        }

        return handler(buttonCode);
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
        buttonFilters,
        entry: this.smm.entry,
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
      this.smm.IPC.off(`${ipcNames.interceptorTriggered}-${id}`);
    }
  }

  async removeAfter(id: string) {
    window.csButtonInterceptors ||= [];

    const interceptorIndex = window.csButtonInterceptors.findIndex(
      (i) => i.id === id
    );
    if (interceptorIndex < 0) {
      return;
    }

    // Returns new list of interceptors
    // Original is now set to removed interceptors
    const newInterceptors = window.csButtonInterceptors.splice(
      0,
      interceptorIndex + 1
    );

    for (const interceptor of window.csButtonInterceptors) {
      await this.removeInterceptor(interceptor.id);
    }

    window.csButtonInterceptors = newInterceptors;
  }

  interceptorExists(id: string) {
    return Boolean(window.csButtonInterceptors?.find((i) => i.id === id));
  }
}
