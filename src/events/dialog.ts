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

export class YatlDialogHideRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dialog-hide-request';
  constructor(public readonly source: HTMLElement) {
    super(YatlDialogHideRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlDialogHideEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dialog-hide';
  constructor() {
    super(YatlDialogHideEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlDialogShowRequest.EVENT_NAME]: YatlDialogShowRequest;
    [YatlDialogShowEvent.EVENT_NAME]: YatlDialogShowEvent;
    [YatlDialogHideRequest.EVENT_NAME]: YatlDialogHideRequest;
    [YatlDialogHideEvent.EVENT_NAME]: YatlDialogHideEvent;
  }
}
