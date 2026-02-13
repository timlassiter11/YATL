import { YatlEvent } from '@timlassiter11/yatl';

export class YatlTagDismissEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tag-dismiss';
  constructor() {
    super(YatlTagDismissEvent.EVENT_NAME);
  }

  public override clone() {
    return new YatlTagDismissEvent();
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlTagDismissEvent.EVENT_NAME]: YatlTagDismissEvent;
  }
}
