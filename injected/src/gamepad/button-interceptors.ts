import { Entry, SMM } from '../smm';
import { INPUT_CODE } from './inputs';
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
      this.patchOnButtonDown();

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

  patchOnButtonDown() {
    // Make sure we have a GamepadNavTree, desktop clients won't
    const inputSources =
      window?.GamepadNavTree?.m_Controller?.m_rgGamepadInputSources;
    if (!inputSources) {
      return;
    }

    // Patch the first input source flagged as a GamePad
    for (const inputSource of inputSources) {
      if (inputSource.m_eNavigationSourceType === INPUT_CODE.GAMEPAD) {
        // Patch over the original OnButtonDown with one that calls out handler
        const origOnButtonDown = inputSource.OnButtonDown.bind(inputSource);
        inputSource.OnButtonDown = function (
          buttonCode: number,
          inputType: number
        ) {
          // If we have a handler registered, call it, and exit if it returns true
          if (window.csButtonInterceptors) {
            for (const { handler } of [
              ...window.csButtonInterceptors,
            ].reverse()) {
              if (handler(buttonCode)) {
                return;
              }
            }
          }

          // If we didn't return from one of our handlers, call the original function
          origOnButtonDown(buttonCode, inputType);
        };

        // Now that we've found a gamepad input source, break out of the loop
        break;
      }
    }
  }

  interceptorExists(id: string) {
    return Boolean(window.csButtonInterceptors?.find((i) => i.id === id));
  }
}
