import { uuidv4 } from '../util';

// modified from https://stackoverflow.com/a/70600070
const getModules = () =>
  new Promise<any>((resolve) => {
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

export const getModuleExportsContaining = async (...contents: string[]) => {
  const modules = (await getModules())[2].c;
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
};

let cachedExports: Record<string, string[]> = {};

let patches: Record<
  string,
  Record<
    string,
    {
      callbacks: ((
        origFunc: (...args: any[]) => any,
        module: any,
        ...args: any[]
      ) => any)[];
    }
  >
> = {};

export const patchExportFromContents = async ({
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
}) => {
  let module: any | undefined;
  let moduleId: string | undefined;

  for (const [_moduleId, moduleContents] of Object.entries(cachedExports)) {
    if (
      contents.every((content) => Object.keys(moduleContents).includes(content))
    ) {
      module = moduleContents;
      moduleId = _moduleId;
      break;
    }
  }

  module ??= await getModuleExportsContaining(...contents);
  moduleId ??= uuidv4();

  if (!module) {
    return undefined;
  }

  cachedExports[moduleId] = module;

  patches[moduleId] ??= {};
  if (!patches[moduleId][exportName]) {
    patches[moduleId][exportName] = {
      callbacks: [],
    };

    const origExport = module[exportName];
    module[exportName] = (...args: any[]) => {
      for (const cb of patches[moduleId!][exportName].callbacks) {
        const res = cb(origExport, module, ...args);
        if (res) {
          return res;
        }
      }

      return origExport(...args);
    };
  }

  patches[moduleId][exportName].callbacks.push(callback);
};

/*
let searchModuleExportsForSubstr = async (
  str: string,
  lower: boolean = true
) => {
  const modules = (await getModules())[2].c;
  let matches = [];
  for (const module of Object.values<any>(modules)) {
    if (!module.exports) {
      continue;
    }

    const keys = Object.keys(module.exports);

    for (const key of keys) {
      if (lower) {
        if (key.toLowerCase().includes(str.toLowerCase())) {
          matches.push({
            key,
            module,
          });
        }
      } else {
        if (key.includes(str)) {
          matches.push({
            key,
            module,
          });
        }
      }
    }
  }

  return matches;
};
*/
