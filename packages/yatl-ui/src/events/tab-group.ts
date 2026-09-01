import { YatlEvent } from '@timlassiter11/yatl';

export class YatlTabChangeRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tab-change-request';
  constructor(public readonly tab: string) {
    super(YatlTabChangeRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlTabChangeEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tab-change';
  constructor(public readonly tab: string) {
    super(YatlTabChangeEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlTabChangeRequest.EVENT_NAME]: YatlTabChangeRequest;
    [YatlTabChangeEvent.EVENT_NAME]: YatlTabChangeEvent;
  }
}
