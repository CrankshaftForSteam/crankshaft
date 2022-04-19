import registerButtons from './buttons';
import registerColours from './colours';

export interface RegisterComponents {
  styles?: string;
  register?: (css: CSSStyleSheet) => void;
}

const registerComponentsFuncs: RegisterComponents[] = [
  registerButtons,
  registerColours,
];

export const registerCustomElements = async () => {
  let styleSheetContents = '';

  for (const { styles } of registerComponentsFuncs) {
    if (styles) {
      styleSheetContents += styles + '\n';
    }
  }

  // Typescript has bad types for constructable stylesheets, so we need some
  // custom types below

  const stylesheet = new CSSStyleSheet();
  await (stylesheet as any).replace(styleSheetContents);

  // im so sorry
  (
    document as Document & { adoptedStyleSheets: CSSStyleSheet[] }
  ).adoptedStyleSheets = [
    ...(document as Document & { adoptedStyleSheets: CSSStyleSheet[] })
      .adoptedStyleSheets,
    stylesheet,
  ];

  for (const { register } of registerComponentsFuncs) {
    register?.(stylesheet);
  }
};
