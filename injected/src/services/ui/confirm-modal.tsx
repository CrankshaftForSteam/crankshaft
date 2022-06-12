// @use-dom-chef

import { dcCreateElement } from '../../dom-chef';

export const confirm = async (
  args: Omit<Parameters<typeof createConfirmModal>[0], 'onConfirm' | 'onCancel'>
) =>
  new Promise<void>((resolve, reject) => {
    const handleConfirm = () => {
      modal.remove();
      resolve();
    };

    const handleCancel = () => {
      modal.remove();
      reject();
    };

    const modal = createConfirmModal({
      ...args,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    });

    document.body.appendChild(modal);
  });

export const createConfirmModal = ({
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const uiMode = window.smmUIMode;

  const modal = dcCreateElement<HTMLDivElement>(
    <div
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
        <button
          className="cs-button"
          onClick={onConfirm}
          style={{ width: '50%' }}
        >
          {confirmText}
        </button>
        <button
          className="cs-button"
          onClick={onCancel}
          style={{ width: '50%', backgroundColor: 'var(--cs-col-secondary)' }}
        >
          {cancelText}
        </button>
      </div>
    </div>
  );

  return modal;
};
