import { isDefined, uuidv4 } from '../util';
import { Service } from './service';

type PatchAddress = readonly [
  moduleId: string,
  exportName: string,
  index: number
];

export class Patch extends Service {
  private cachedExports: Record<string, string[]> = {};
  private patches: Record<
    string,
    Record<
      string,
      {
        callbacks: (
          | ((
              origFunc: (...args: any[]) => any,
              module: any,
              ...args: any[]
            ) => any)
          | undefined
        )[];
      }
    >
  > = {};

  // modified from https://stackoverflow.com/a/70600070
  private getModules() {
    return new Promise<any>((resolve) => {
      const id = uuidv4();
      window.webpackJsonp.push([
        id,
        {
          [id]: (...args: any[]) => {
            resolve(args);
          },
        },
        [[id]],
      ]);
    });
  }

  private async getModuleExportsContaining(...contents: string[]) {
    const modules = (await this.getModules())[2].c;
    for (const module of Object.values<{ exports?: Record<string, any> }>(
      modules
    )) {
      if (!module.exports) {
        continue;
      }

      const keys = Object.keys(module.exports);

      if (contents.every((content) => keys.includes(content))) {
        return module.exports;
      }
    }
  }

  async patchExportFromContents({
    contents,
    export: exportName,
    callback,
  }: {
    contents: string[];
    export: string;
    callback: (
      origFunc: (...args: any[]) => any,
      module: any,
      ...args: any[]
    ) => any;
  }): Promise<PatchAddress | undefined> {
    let module: any | undefined;
    let moduleId: string | undefined;

    for (const [_moduleId, moduleContents] of Object.entries(
      this.cachedExports
    )) {
      if (
        contents.every((content) =>
          Object.keys(moduleContents).includes(content)
        )
      ) {
        module = moduleContents;
        moduleId = _moduleId;
        break;
      }
    }

    module ??= await this.getModuleExportsContaining(...contents);
    moduleId ??= uuidv4();

    if (!module) {
      return undefined;
    }

    this.cachedExports[moduleId] = module;

    this.patches[moduleId] ??= {};
    if (!this.patches[moduleId][exportName]) {
      this.patches[moduleId][exportName] = {
        callbacks: [],
      };

      const origExport = module[exportName];
      module[exportName] = (...args: any[]) => {
        for (const cb of this.patches[moduleId!][exportName].callbacks.filter(
          isDefined
        )) {
          const res = cb(origExport, module, ...args);
          if (res) {
            return res;
          }
        }

        return origExport(...args);
      };
    }

    this.patches[moduleId][exportName].callbacks.push(callback);

    return [
      moduleId,
      exportName,
      this.patches[moduleId][exportName].callbacks.length - 1,
    ];
  }

  removePatch(addr: PatchAddress) {
    this.patches[addr[0]][addr[1]].callbacks[addr[2]] = undefined;
  }
}
