import { YatlEvent } from '@timlassiter11/yatl';

export class YatlDetailsToggleEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-details-toggle';
  constructor(public readonly open: boolean) {
    super(YatlDetailsToggleEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlDetailsToggleEvent.EVENT_NAME]: YatlDetailsToggleEvent;
  }
}
