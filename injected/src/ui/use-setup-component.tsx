import { useEffect, useRef } from 'preact/hooks';

export const useSetupComponent = <T extends HTMLElement>(
  css: CSSStyleSheet
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    // Add CSS to shadow root
    const root:
      | (ParentNode & { adoptedStyleSheets?: CSSStyleSheet[] })
      | undefined
      | null = ref.current?.parentNode;
    if (root?.adoptedStyleSheets) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, css];
    }
  }, [ref]);

  return ref;
};
