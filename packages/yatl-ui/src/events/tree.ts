import { YatlEvent } from '@timlassiter11/yatl';
import { YatlTreeItem } from '../components';

export class YatlSelectionChangeRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-selection-change-request';
  constructor(
    public readonly item: YatlTreeItem,
    public readonly newState: boolean,
  ) {
    super(YatlSelectionChangeRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlSelectionChangeEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-selection-change';
  constructor() {
    super(YatlSelectionChangeEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlSelectionChangeRequest.EVENT_NAME]: YatlSelectionChangeRequest;
    [YatlSelectionChangeEvent.EVENT_NAME]: YatlSelectionChangeEvent;
  }
}
