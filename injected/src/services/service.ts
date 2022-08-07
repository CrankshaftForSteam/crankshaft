import { SMM } from '../smm';

export abstract class Service {
  smm: SMM;

  constructor(smm: SMM) {
    this.smm = smm;
  }
}
