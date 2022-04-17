// @use-dom-chef

import { VNode } from 'preact';

// Create HTML elements from JSX using dom-chef
// Typescript is configured to use Preact types for JSX, this function wraps
// the JSX to return a DOM HTML element type.
export const dcCreateElement = <T extends HTMLElement>(jsx: VNode) =>
  jsx as unknown as T;
