import { YatlEvent } from '@timlassiter11/yatl';

export class YatlTableViewFiltersClearEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-table-view-filters-clear';
  constructor() {
    super(YatlTableViewFiltersClearEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlTableViewFiltersClearEvent.EVENT_NAME]: YatlTableViewFiltersClearEvent;
  }
}
