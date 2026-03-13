import { YatlEvent } from '@timlassiter11/yatl';
import { YatlSpinnerState } from '../components';

export class YatlSpinnerStateChangeEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-spinner-state-change';
  constructor(public readonly state: YatlSpinnerState) {
    super(YatlSpinnerStateChangeEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlSpinnerStateChangeEvent.EVENT_NAME]: YatlSpinnerStateChangeEvent;
  }
}
