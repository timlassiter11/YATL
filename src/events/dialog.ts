import { YatlEvent } from './base';

export class YatlDialogShowRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dialog-show-request';
  constructor() {
    super(YatlDialogShowRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlDialogShowEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dialog-show';
  constructor() {
    super(YatlDialogShowEvent.EVENT_NAME);
  }
}

export class YatlDialogCloseRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dialog-close-request';
  constructor() {
    super(YatlDialogCloseRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlDialogCloseEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dialog-close';
  constructor() {
    super(YatlDialogCloseEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlDialogShowRequest.EVENT_NAME]: YatlDialogShowRequest;
    [YatlDialogShowEvent.EVENT_NAME]: YatlDialogShowEvent;
    [YatlDialogCloseRequest.EVENT_NAME]: YatlDialogCloseRequest;
    [YatlDialogCloseEvent.EVENT_NAME]: YatlDialogCloseEvent;
  }
}
