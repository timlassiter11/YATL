import { YatlEvent } from '@timlassiter11/yatl';

export class YatlTreeItemSelectRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tree-item-select-request';
  constructor() {
    super(YatlTreeItemSelectRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlTreeItemSelectEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tree-item-select';
  constructor() {
    super(YatlTreeItemSelectEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlTreeItemSelectRequest.EVENT_NAME]: YatlTreeItemSelectRequest;
    [YatlTreeItemSelectEvent.EVENT_NAME]: YatlTreeItemSelectEvent;
  }
}
