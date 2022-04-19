import classNames from 'classnames';
import { FunctionComponent, JSX } from 'preact';
import register from 'preact-custom-element';
import { useSetupComponent } from './use-setup-component';

const buttonStyles = `
	.cs-button {
		width: auto;
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

	.cs-button:focus-visible {
		background-color: white;
		color: black;
	}
`;

export type ButtonProps = JSX.HTMLAttributes<HTMLButtonElement>;

const Button =
  (css: CSSStyleSheet): FunctionComponent<ButtonProps> =>
  (props) =>
    (
      <button
        ref={useSetupComponent(css)}
        className={classNames('cs-button', props.className)}
        {...props}
      >
        {props.children}
      </button>
    );

export default {
  styles: buttonStyles,
  register: (css: CSSStyleSheet) => {
    register(Button(css), 'cs-button', [], { shadow: true });
  },
};
