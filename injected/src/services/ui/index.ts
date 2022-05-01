import { Service } from '../Service';
import { createProgressModal } from './progress-modal';

export class UI extends Service {
  createProgressModal(...args: Parameters<typeof createProgressModal>) {
    return createProgressModal(...args);
  }
}
