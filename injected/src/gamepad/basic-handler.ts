import { uuidv4 } from '../util';
import { BTN_CODE } from './buttons';
import { shouldAllowButtonPresses } from './overrides';

// This is a handler for pages that haven't implemented gamepad support
// All it does is intercept button presses and close the page when the B
// button is pressed.
//  TODO: maybe show an indicator to indicate lack of proper gamepad support
export const attachBasicGamepadHandler = (onExit?: () => void) => {
  const interceptorId = uuidv4();

  window.csButtonInterceptors = window.csButtonInterceptors || [];
  window.csButtonInterceptors.push({
    id: interceptorId,
    handler: (buttonCode) => {
      if (shouldAllowButtonPresses()) {
        return false;
      }

      if (
        buttonCode === BTN_CODE.MENU ||
        buttonCode === BTN_CODE.QUICK_ACCESS
      ) {
        return false;
      }

      // Don't allow buttons other than back
      if (buttonCode !== BTN_CODE.B) {
        return true;
      }

      onExit?.();

      // Remove this interceptor
      window.csButtonInterceptors = window.csButtonInterceptors?.filter(
        (i) => i.id !== interceptorId
      );

      // Stop button input
      return true;
    },
  });
};
