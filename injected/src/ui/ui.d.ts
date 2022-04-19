import { ButtonProps } from './buttons';

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'cs-button': ButtonProps;
    }
  }
}
