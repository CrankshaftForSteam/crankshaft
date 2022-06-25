import { SMM } from '../../smm';
import { Service } from '../service';
import { confirm, createConfirmModal } from './confirm-modal';
import { createProgressModal } from './progress-modal';

export class UI extends Service {
  confirm: typeof confirm;
  createConfirmModal: typeof createConfirmModal;
  createProgressModal: typeof createProgressModal;

  constructor(smm: SMM) {
    super(smm);

    this.confirm = confirm;
    this.createConfirmModal = createConfirmModal;
    this.createProgressModal = createProgressModal;
  }
}
