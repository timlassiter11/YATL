import { YatlEvent } from '@timlassiter11/yatl';

export class YatlFlyoutShowRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-flyout-show-request';
  constructor() {
    super(YatlFlyoutShowRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlFlyoutShowEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-flyout-show';
  constructor() {
    super(YatlFlyoutShowEvent.EVENT_NAME);
  }
}

export class YatlFlyoutHideRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-flyout-hide-request';
  constructor(public readonly source: HTMLElement) {
    super(YatlFlyoutHideRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlFlyoutHideEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-flyout-hide';
  constructor() {
    super(YatlFlyoutHideEvent.EVENT_NAME);
  }
}

export class YatlFlyoutFullscreenEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-flyout-fullscreen';
  constructor(public readonly fullscreen: boolean) {
    super(YatlFlyoutFullscreenEvent.EVENT_NAME);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlFlyoutShowRequest.EVENT_NAME]: YatlFlyoutShowRequest;
    [YatlFlyoutShowEvent.EVENT_NAME]: YatlFlyoutShowEvent;
    [YatlFlyoutHideRequest.EVENT_NAME]: YatlFlyoutHideRequest;
    [YatlFlyoutHideEvent.EVENT_NAME]: YatlFlyoutHideEvent;
    [YatlFlyoutFullscreenEvent.EVENT_NAME]: YatlFlyoutFullscreenEvent;
  }
}
