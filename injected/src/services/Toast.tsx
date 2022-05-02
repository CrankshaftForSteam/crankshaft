import { FunctionComponent, render } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { deleteAll, uuidv4 } from '../util';
import { Service } from './Service';

type ToastLevel = 'error' | 'info' | 'success';

interface AddToastInfo {
  message: string;
  level: ToastLevel;
  timeout?: number;
}

type AddToastEvent = CustomEvent<AddToastInfo>;

const DEFAULT_TOAST_TIMEOUT = 3000;

export class Toast extends Service {
  private readonly toastEvents: EventTarget;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);

    this.toastEvents = new EventTarget();

    deleteAll('[data-smm-toasts]');

    render(
      <ToastsContainer toastEvents={this.toastEvents} />,
      document.body.appendChild(document.createElement('div'))
    );
  }

  addToast(
    message: string,
    level: ToastLevel = 'error',
    options?: { timeout?: number }
  ) {
    this.toastEvents.dispatchEvent(
      new CustomEvent<AddToastInfo>('addToast', {
        detail: { message, level, timeout: options?.timeout },
      })
    );
  }
}

const ToastsContainer: FunctionComponent<{ toastEvents: EventTarget }> = ({
  toastEvents,
}) => {
  const [toasts, setToasts] = useState<(AddToastInfo & { id: string })[]>([]);

  useEffect(() => {
    toastEvents.addEventListener('addToast', (e: Event) => {
      const { message, level, timeout } = (e as AddToastEvent).detail;
      setToasts((prev) => [...prev, { id: uuidv4(), message, level, timeout }]);
    });
  }, [toastEvents, setToasts]);

  const handleRemove = useCallback(
    (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [setToasts]
  );

  return (
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
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => handleRemove(toast.id)}
        />
      ))}
    </ul>
  );
};

const ToastItem: FunctionComponent<{
  toast: AddToastInfo;
  onRemove: () => void;
}> = ({ toast: { message, level, timeout }, onRemove }) => {
  const toastEl = useRef<HTMLLIElement>(null);

  const removeToast = useCallback(async () => {
    if (!toastEl.current) {
      return;
    }

    await toastEl.current.animate([{ opacity: 0 }], {
      duration: 300,
      fill: 'forwards',
    }).finished;

    onRemove();
  }, [onRemove, toastEl]);

  useEffect(() => {
    (async () => {
      if (!toastEl.current) {
        return;
      }

      setTimeout(removeToast, timeout ?? DEFAULT_TOAST_TIMEOUT);

      await toastEl.current.animate([{ opacity: 1 }], {
        duration: 300,
        fill: 'forwards',
      }).finished;
    })();
  }, [toastEl, removeToast, timeout]);

  return (
    <li
      ref={toastEl}
      onClick={removeToast}
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
};
