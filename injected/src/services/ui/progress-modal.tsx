import classNames from 'classnames';
import { dcCreateElement } from '../../dom-chef';
import { GP_FOCUS_CLASS } from '../../gamepad';
import { BTN_CODE } from '../../gamepad/buttons';
import { deleteAll, formatBytes } from '../../util';
import { DownloadProgress } from '../network';

// @use-dom-chef

export const createProgressModal = ({
  displayName,
  fileName,
  progress = true,
  title = 'Downloading,',
}: {
  displayName: string;
  fileName: string;
  progress: boolean;
  title: string;
}) => {
  const uiMode = window.smmUIMode;

  const gamepadEnabled = Boolean(window.smm?.activeGamepadHandler);

  deleteAll('[data-smm-proton-updater-progress-modal]');

  const progressText = dcCreateElement<HTMLHeadingElement>(
    <h3
      style={{
        margin: 0,
        marginBottom: 8,
      }}
    >
      <span>0%</span>
      <span style={{ color: 'rgba(184, 188, 191, 75%)', marginLeft: 10 }}>
        14 MB / 300 MB
      </span>
    </h3>
  );
  const progressSpan = dcCreateElement<HTMLSpanElement>(
    <span
      style={{
        display: 'block',
        width: '0%',
        height: '100%',
        backgroundColor: '#1a9fff',
        borderRadius: 12,
      }}
    />
  );

  const cancelButton = dcCreateElement<HTMLButtonElement>(
    <button
      style={{
        backgroundColor: '#1a9fff',
        textTransform: 'uppercase',
        border: 'none',
        borderRadius: 2,
        color: 'white',
        cursor: 'pointer',
        alignSelf: 'flex-end',
        fontSize: 16,
        padding: '4px 12px',
        marginTop: 12,
      }}
      className={classNames({
        [GP_FOCUS_CLASS]: gamepadEnabled,
      })}
    >
      Cancel
    </button>
  );

  const modal = dcCreateElement<HTMLDivElement>(
    <div
      data-smm-modal={true}
      data-smm-proton-updater-progress-modal={true}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 'auto',
        zIndex: 9999,

        height: 'min-content',
        maxWidth: uiMode === 'deck' ? '60%' : '40%',

        display: 'flex !important',
        flexDirection: 'column',
        justifyContent: 'space-between',

        backgroundColor: '#23262e',
        borderRadius: 8,
        boxShadow: '-12px 18px 24px -12px rgba(0, 0, 0, 0.5)',
        color: '#b8bcbf',
        padding: 20,
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        {title} {displayName}...
      </h2>
      {progress ? (
        <>
          {progressText}
          <div
            style={{
              height: 12,
              backgroundColor: 'rgba(255, 255, 255, 10%)',
              borderRadius: 12,
            }}
          >
            {progressSpan}
          </div>
        </>
      ) : null}
      {cancelButton}
    </div>
  );

  return {
    open: (cancel: () => void) => {
      modal.style.display = '';

      cancelButton.onclick = () => {
        cancel();
        modal.remove();
      };

      if (gamepadEnabled) {
        window.csButtonInterceptors = window.csButtonInterceptors || [];
        window.csButtonInterceptors.push({
          id: 'progress-modal',
          handler: (buttonCode) => {
            if (buttonCode === BTN_CODE.A) {
              cancel();
              modal.remove();
              window.csButtonInterceptors = window.csButtonInterceptors?.filter(
                (i) => i.id !== 'progress-modal'
              );
            }
            return true;
          },
        });
      }

      document.querySelector('body')?.appendChild(modal);
    },
    update: ({
      progressPercent,
      progressBytes,
      finalSizeBytes,
    }: DownloadProgress) => {
      const progress = `${progressPercent}%`;
      progressText.children[0].textContent = progress;
      progressText.children[1].textContent = `${formatBytes(
        progressBytes
      )} / ${formatBytes(finalSizeBytes)}`;
      progressSpan.style.width = progress;
    },
    close: () => {
      modal.remove();
      window.csButtonInterceptors = window.csButtonInterceptors?.filter(
        (i) => i.id !== 'progress-modal'
      );
    },
  };
};
