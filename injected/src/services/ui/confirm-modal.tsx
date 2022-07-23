import classNames from 'classnames';
import { dcCreateElement } from '../../dom-chef';
import { GP_FOCUS_CLASS } from '../../gamepad';
import { BTN_CODE } from '../../gamepad/buttons';

// @use-dom-chef

export class ConfirmModalCancelledError extends Error {
  constructor() {
    super('User pressed cancel');
  }
}

export const confirm = async (
  args: Omit<Parameters<typeof createConfirmModal>[0], 'onConfirm' | 'onCancel'>
) =>
  new Promise<void>((resolve, reject) => {
    const handleConfirm = () => {
      modal.remove();
      backdrop?.remove();
      resolve();
    };

    const handleCancel = () => {
      modal.remove();
      backdrop?.remove();
      reject(new ConfirmModalCancelledError());
    };

    const { modal, backdrop } = createConfirmModal({
      ...args,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    });

    document.body.appendChild(modal);
    if (backdrop) {
      document.body.appendChild(backdrop);
    }
  });

export const createConfirmModal = ({
  message,
  confirmText = 'Confirm',
  confirmBackgroundColour,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  backdrop = true,
}: {
  message: string;
  confirmText?: string;
  confirmBackgroundColour?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  backdrop?: boolean;
}) => {
  const uiMode = window.smmUIMode;

  const gamepadEnabled = Boolean(window.smm?.activeGamepadHandler);

  const confirmButton = dcCreateElement<HTMLButtonElement>(
    <button
      className="cs-button"
      onClick={onConfirm}
      style={{ width: '50%', backgroundColor: confirmBackgroundColour }}
    >
      {confirmText}
    </button>
  );

  const cancelButton = dcCreateElement<HTMLButtonElement>(
    <button
      className={classNames('cs-button', {
        [GP_FOCUS_CLASS]: gamepadEnabled,
      })}
      onClick={onCancel}
      style={{ width: '50%', backgroundColor: 'var(--cs-col-secondary)' }}
    >
      {cancelText}
    </button>
  );

  if (gamepadEnabled) {
    window.csButtonInterceptors = window.csButtonInterceptors || [];
    window.csButtonInterceptors.push({
      id: 'confirm-modal',
      handler: buttonInterceptor({
        cancelButton,
        confirmButton,
        onCancel,
        onConfirm,
      }),
    });
  }

  const backdropEl = backdrop
    ? dcCreateElement<HTMLDivElement>(
        <div
          data-smm-modal
          style={{
            backgroundColor: 'rgba(0, 0, 0, 30%)',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: '100%',
            zIndex: 9998,
          }}
          onClick={onCancel}
        />
      )
    : undefined;

  const modal = dcCreateElement<HTMLDivElement>(
    <div
      data-smm-modal
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 'auto',
        zIndex: 9999,

        height: 'min-content',
        maxWidth: uiMode === 'deck' ? '40%' : '30%',

        display: 'flex !important',
        flexDirection: 'column',

        backgroundColor: '#23262e',
        borderRadius: 8,
        boxShadow: '-12px 18px 24px -12px rgba(0, 0, 0, 0.5)',
        color: '#b8bcbf',
        padding: 20,
      }}
    >
      <span>{message}</span>
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 16,
        }}
      >
        {confirmButton}
        {cancelButton}
      </div>
    </div>
  );

  return { modal, backdrop: backdropEl };
};

const buttonInterceptor =
  ({
    cancelButton,
    confirmButton,
    onCancel,
    onConfirm,
  }: {
    cancelButton: HTMLButtonElement;
    confirmButton: HTMLButtonElement;
    onCancel: () => void;
    onConfirm: () => void;
  }) =>
  (buttonCode: number) => {
    const handleCancel = () => {
      window.csButtonInterceptors = window.csButtonInterceptors?.filter(
        (i) => i.id !== 'confirm-modal'
      );
      onCancel();
    };

    switch (buttonCode) {
      case BTN_CODE.A:
        if (confirmButton.classList.contains(GP_FOCUS_CLASS)) {
          onConfirm();
        } else {
          handleCancel();
        }
        break;

      case BTN_CODE.B:
        handleCancel();
        break;

      case BTN_CODE.LEFT:
        confirmButton.classList.add(GP_FOCUS_CLASS);
        cancelButton.classList.remove(GP_FOCUS_CLASS);
        break;

      case BTN_CODE.RIGHT:
        confirmButton.classList.remove(GP_FOCUS_CLASS);
        cancelButton.classList.add(GP_FOCUS_CLASS);
        break;
    }

    return true;
  };
