import { YatlEvent } from './base';

export class YatlTagDismissEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tag-dismiss';
  constructor() {
    super(YatlTagDismissEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlTagDismissEvent.EVENT_NAME]: YatlTagDismissEvent;
  }
}
