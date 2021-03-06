import register from '@avery42/preact-custom-element';
import classNames from 'classnames';
import { FunctionComponent, JSX } from 'preact';

const buttonStyles = `
	.cs-button {
		display: inline-block;
		width: fit-content;
		padding: 6px 12px;

		background-color: var(--cs-col-primary);
		color: white;
		text-transform: uppercase;

		border: none;
		border-radius: 2px;

		cursor: pointer;

		transition: all 300ms;
	}

	.cs-button:hover {
		background-color: var(--cs-col-primary-hover);
	}

	.cs-button:focus {
		outline: none;
	}

	.cs-button:focus-visible {
		outline: revert;
		background-color: white;
		color: black;
	}

	.cs-button:disabled {
		background-color: var(--cs-col-secondary);
		cursor: auto;
	}
`;

export type ButtonProps = JSX.HTMLAttributes<HTMLButtonElement>;

const Button: FunctionComponent<ButtonProps> = (props) => (
  <button
    className={classNames('cs-button', props.className)}
    tabIndex={0}
    {...props}
  >
    {props.children}
  </button>
);

export default (css: CSSStyleSheet) => {
  register(Button, 'cs-button', ['disabled'], {
    shadow: true,
    adoptedStyleSheets: [css],
  });
  return buttonStyles;
};
