import { YatlEvent } from '@timlassiter11/yatl';

export class YatlConfirmationDialogAcceptEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-confirmation-dialog-accept';
  constructor() {
    super(YatlConfirmationDialogAcceptEvent.EVENT_NAME);
  }
}

export class YatlConfirmationDialogRejectEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-confirmation-dialog-reject';
  constructor() {
    super(YatlConfirmationDialogRejectEvent.EVENT_NAME);
  }
}

export class YatlConfirmationDialogCancelEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-confirmation-dialog-cancel';
  constructor() {
    super(YatlConfirmationDialogCancelEvent.EVENT_NAME);
  }
}

/** Fired after the dialog has finished showing (post-animation). */
export class YatlConfirmationDialogShowEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-confirmation-dialog-show';
  constructor() {
    super(YatlConfirmationDialogShowEvent.EVENT_NAME);
  }
}

/** Fired after the dialog has finished hiding (post-animation). */
export class YatlConfirmationDialogHideEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-confirmation-dialog-hide';
  constructor() {
    super(YatlConfirmationDialogHideEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlConfirmationDialogAcceptEvent.EVENT_NAME]: YatlConfirmationDialogAcceptEvent;
    [YatlConfirmationDialogRejectEvent.EVENT_NAME]: YatlConfirmationDialogRejectEvent;
    [YatlConfirmationDialogCancelEvent.EVENT_NAME]: YatlConfirmationDialogCancelEvent;
    [YatlConfirmationDialogShowEvent.EVENT_NAME]: YatlConfirmationDialogShowEvent;
    [YatlConfirmationDialogHideEvent.EVENT_NAME]: YatlConfirmationDialogHideEvent;
  }
}
