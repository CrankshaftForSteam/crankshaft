import registerButtons from './buttons';
import registerColours from './colours';

const registerComponentsFuncs = [registerButtons, registerColours];

export const registerCustomElements = async () => {
  const stylesheet = new CSSStyleSheet();

  // TODO: load these styles from a .css file
  // Had an issue with esbuild loading the text from the file
  let styleSheetContents = `
.cs-gp-focus {
  outline: solid 2px white;
}
  `;

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
