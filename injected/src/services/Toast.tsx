import { deleteAll } from '../util';
import { Service } from './Service';

const TOAST_TIMEOUT = 3000;

export class Toast extends Service {
  readonly toastsContainer: HTMLUListElement;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);

    // Create toasts container
    deleteAll('[data-smm-toasts]');

    this.toastsContainer = (
      <ul
        data-smm-toasts={true}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          marginLeft: 'auto',
          marginRight: 'auto',
          width: 400,
          zIndex: 999999,

          display: 'flex',
          flexDirection: 'column',
        }}
      />
    ) as HTMLElement as HTMLUListElement;
    document.querySelector('body')?.appendChild(this.toastsContainer);
  }

  addToast(message: string, level: 'error' | 'info' | 'success' = 'error') {
    const newToast = (
      <li
        style={{
          marginTop: 8,

          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',

          backgroundColor:
            level === 'error'
              ? 'rgb(209, 28, 28)'
              : level === 'info'
              ? '#1a9fff'
              : '#01a75b',
          borderRadius: 4,
          padding: '0px 12px 6px',

          color: 'white',
          textAlign: 'center',
          fontSize: 12,

          cursor: 'pointer',

          opacity: 0,
        }}
      >
        <span>{message}</span>
        <button
          style={{
            marginLeft: 12,

            border: 'none',
            background: 'none',

            color: 'rgba(255, 255, 255, 50%)',
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          x
        </button>
      </li>
    );

    const removeToast = () => {
      new Promise(async function () {
        await newToast.animate([{ opacity: 0 }], {
          duration: 300,
          fill: 'forwards',
        }).finished;
        newToast.remove();
      });
    };

    newToast.addEventListener('click', removeToast);
    setTimeout(removeToast, TOAST_TIMEOUT);

    this.toastsContainer.appendChild(newToast);

    new Promise(async () => {
      await newToast.animate([{ opacity: 1 }], {
        duration: 300,
        fill: 'forwards',
      }).finished;
    });
  }
}
