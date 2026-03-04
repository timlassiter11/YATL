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

declare global {
  interface HTMLElementEventMap {
    [YatlConfirmationDialogAcceptEvent.EVENT_NAME]: YatlConfirmationDialogAcceptEvent;
    [YatlConfirmationDialogRejectEvent.EVENT_NAME]: YatlConfirmationDialogRejectEvent;
  }
}
