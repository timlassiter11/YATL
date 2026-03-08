import { YatlEvent } from '@timlassiter11/yatl';
import { YatlToastData } from '../types';

export class YatlToastRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-toast-request';
  constructor(public readonly data: YatlToastData) {
    super(YatlToastRequest.EVENT_NAME);
  }
}

export class YatlToastHideEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-toast-hide';
  constructor() {
    super(YatlToastHideEvent.EVENT_NAME);
  }
}

declare global {
  interface WindowEventMap {
    [YatlToastRequest.EVENT_NAME]: YatlToastRequest;
  }

  interface HTMLElementEventMap {
    [YatlToastHideEvent.EVENT_NAME]: YatlToastHideEvent;
  }
}
