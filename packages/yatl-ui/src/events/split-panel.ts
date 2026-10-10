import { YatlEvent } from '@timlassiter11/yatl';

export class YatlSplitPanelPositionEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-split-panel-position';
  constructor(
    public readonly position: number,
    public readonly dragging: boolean,
  ) {
    super(YatlSplitPanelPositionEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlSplitPanelPositionEvent.EVENT_NAME]: YatlSplitPanelPositionEvent;
  }
}
