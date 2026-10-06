import { YatlEvent } from '@timlassiter11/yatl';

export class YatlTreeItemSelectRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tree-item-select-request';
  constructor(public readonly value: string) {
    super(YatlTreeItemSelectRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlTreeItemSelectEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tree-item-select';
  constructor(public readonly value: string) {
    super(YatlTreeItemSelectEvent.EVENT_NAME);
  }
}

export class YatlTreeItemToggleRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tree-item-toggle-request';
  constructor(public readonly value: string) {
    super(YatlTreeItemSelectRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlTreeItemToggleEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tree-item-toggle';
  constructor(public readonly value: string) {
    super(YatlTreeItemSelectEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlTreeItemSelectRequest.EVENT_NAME]: YatlTreeItemSelectRequest;
    [YatlTreeItemSelectEvent.EVENT_NAME]: YatlTreeItemSelectEvent;
    [YatlTreeItemToggleRequest.EVENT_NAME]: YatlTreeItemToggleRequest;
    [YatlTreeItemToggleEvent.EVENT_NAME]: YatlTreeItemToggleEvent;
  }
}
