import { logoIcon } from '../../assets/assets';
import { SMM } from '../../smm';

const hasClassContaining = (substr: string, createElementArgs: any[]) => {
  return (
    createElementArgs.length >= 1 &&
    createElementArgs[1] &&
    createElementArgs[1].className &&
    createElementArgs[1].className.includes(substr)
  );
};

export const addModsButton = async (smm: SMM, onClick: () => void) => {
  await smm.Patch.patchExportFromContents({
    contents: [
      'useState',
      'useEffect',
      'useCallback',
      'useMemo',
      'memo',
      'createElement',
      'cloneElement',
    ],
    export: 'createElement',
    callback: (origFunc, react, ...args) => {
      if (
        hasClassContaining('GameListHomeAndSearch', args) &&
        !args.some((arg) => arg?.props?.['data-smm-menu-button'])
      ) {
        const buttonClass = document.querySelector(
          '[class*=gamelisthome_CollectionButton]'
        );

        return origFunc(
          ...args,
          react.cloneElement(args[3], {
            children: react.createElement('button', {
              children: react.createElement('img', {
                src: logoIcon,
                width: 24,
              }),
              style: {
                width: '100%',
                height: 32,
                padding: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: 'none',
                filter: 'brightness(1)',
                transition: 'all 150ms',
              },
              class: buttonClass?.className,
              onClick,
            }),
            'data-smm-menu-button': true,
            style: {
              width: 36,
              height: 36,
            },
          })
        );
      }
    },
  });

  await smm.Patch.patchExportFromContents({
    contents: [
      'useState',
      'useEffect',
      'useCallback',
      'useMemo',
      'memo',
      'createElement',
      'cloneElement',
    ],
    export: 'createElement',
    callback: (origFunc, react, ...args) => {
      if (args[0] === 'div' && hasClassContaining('library_Container_', args)) {
        // Make sure menu container is always at end of library element
        // TODO: this should probably just fully render from a patch
        const menuContainer = document.querySelector<HTMLDivElement>(
          '[data-smm-menu-page-container]'
        );
        menuContainer?.parentElement?.appendChild(menuContainer);

        return origFunc(...args);
      }
    },
  });
};
