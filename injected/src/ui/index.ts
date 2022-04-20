import registerButtons from './buttons';
import registerColours from './colours';

const registerComponentsFuncs = [registerButtons, registerColours];

export const registerCustomElements = async () => {
  const stylesheet = new CSSStyleSheet();
  let styleSheetContents = '';

  for (const r of registerComponentsFuncs) {
    styleSheetContents += r(stylesheet) ?? '';
  }

  // Typescript has bad types for constructable stylesheets, so we need some
  // custom types below

  await (stylesheet as any).replace(styleSheetContents);

  // im so sorry
  (
    document as Document & { adoptedStyleSheets: CSSStyleSheet[] }
  ).adoptedStyleSheets = [
    ...(document as Document & { adoptedStyleSheets: CSSStyleSheet[] })
      .adoptedStyleSheets,
    stylesheet,
  ];
};
