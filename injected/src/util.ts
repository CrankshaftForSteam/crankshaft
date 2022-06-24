export const info = (...args: any[]) => console.info('[SMM]', ...args);

// https://stackoverflow.com/a/2117523
export const uuidv4 = () =>
  // @ts-ignore
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );

export const deleteAll = (selector: string) =>
  document.querySelectorAll(selector).forEach((node) => node.remove());

// https://stackoverflow.com/a/18650828
export const formatBytes = (bytes: number, decimals: number = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const waitForElement = <T extends HTMLElement>(selector: string) =>
  new Promise<T>((resolve) => {
    const check = () => {
      const el = document.querySelector<T>(selector);
      if (el) {
        resolve(el);
      }
    };

    check();

    const observer = new MutationObserver(() => {
      check();
    });
    observer.observe(document, { subtree: true, childList: true });
  });

// Check if the element is at least partially outside of the container element
export const isOutsideContainer = (
  element: HTMLElement,
  container: HTMLElement
) => {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  return (
    elementRect.top < containerRect.top ||
    elementRect.bottom > containerRect.bottom
  );
};
