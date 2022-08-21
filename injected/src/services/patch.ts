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

  async getModules(): Promise<Record<string, any>> {
    // Fix for Steam beta/preview update, the other path can be removed once
    // the update makes it to stable.
    if (window.webpackChunksteamui) {
      // see https://github.com/webpack/webpack/blob/8729f2e787c1780b5b1109df7738521621609d61/lib/web/JsonpChunkLoadingRuntimeModule.js#L401
      return new Promise<any>((resolve) => {
        const chunkIds: string[] = window.webpackChunksteamui
          .flatMap((chunk: any) => chunk)
          .filter(
            (idOrChunk: Object | Array<any>) =>
              typeof idOrChunk === 'object' && !Array.isArray(idOrChunk)
          )
          .map((chunk: Object) => Object.keys(chunk))
          .flat();

        window.webpackChunksteamui.push([
          [uuidv4()],
          {},
          (__webpack_require__: (id: string) => any) => {
            const modules = chunkIds.reduce<Record<string, any>>((prev, id) => {
              prev[id] = __webpack_require__(id);
              return prev;
            }, {});
            resolve(modules);
          },
        ]);
      });
    }

    // modified from https://stackoverflow.com/a/70600070
    return new Promise((resolve) => {
      const id = uuidv4();
      window.webpackJsonp.push([
        id,
        {
          [id]: (...args: any[]) => {
            const modules = args[2].c as Record<
              string,
              { i: string; exports: any }
            >;
            resolve(
              Object.values(modules).reduce<Record<string, any>>(
                (prev, cur) => {
                  prev[cur.i] = cur.exports;
                  return prev;
                },
                {}
              )
            );
          },
        },
        [[id]],
      ]);
    });
  }

  async getModuleExportsContaining(...contents: string[]) {
    const modules = await this.getModules();
    for (const module of Object.values(modules)) {
      const keys = Object.keys(module);

      if (contents.every((content) => keys.includes(content))) {
        return module;
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
