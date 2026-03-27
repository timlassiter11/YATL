import { YatlEvent } from '@timlassiter11/yatl';
import { type YatlOption } from '../components';

export class YatlDropdownToggleRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-toggle-request';
  constructor(public readonly open: boolean) {
    super(YatlDropdownToggleRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlDropdownToggleEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-toggle';
  constructor(public readonly open: boolean) {
    super(YatlDropdownToggleEvent.EVENT_NAME);
  }
}

export class YatlDropdownSelectEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-select';
  constructor(public readonly item: YatlOption) {
    super(YatlDropdownSelectEvent.EVENT_NAME, { cancelable: true });
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlDropdownToggleRequest.EVENT_NAME]: YatlDropdownToggleRequest;
    [YatlDropdownToggleEvent.EVENT_NAME]: YatlDropdownToggleEvent;
    [YatlDropdownSelectEvent.EVENT_NAME]: YatlDropdownSelectEvent;
  }
}
