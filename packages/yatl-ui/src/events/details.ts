import { YatlEvent } from '@timlassiter11/yatl';

export class YatlDetailsOpenEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-details-open';
  constructor() {
    super(YatlDetailsOpenEvent.EVENT_NAME);
  }

  public override clone() {
    return new YatlDetailsOpenEvent();
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlDetailsOpenEvent.EVENT_NAME]: YatlDetailsOpenEvent;
  }
}
