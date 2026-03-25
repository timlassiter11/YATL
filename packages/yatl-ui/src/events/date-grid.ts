import { YatlEvent } from '@timlassiter11/yatl';

export class YatlDateSelected extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-date-selected';
  constructor(public readonly date: Date) {
    super(YatlDateSelected.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlDateSelected.EVENT_NAME]: YatlDateSelected;
  }
}
