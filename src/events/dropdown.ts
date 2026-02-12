import { type YatlOption } from '../components';
import { YatlEvent } from './base';

export class YatlDropdownOpenRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-open-request';
  constructor() {
    super(YatlDropdownOpenRequest.EVENT_NAME, { cancelable: true });
  }

  public override clone() {
    return new YatlDropdownOpenRequest();
  }
}

export class YatlDropdownOpenEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-open';
  constructor() {
    super(YatlDropdownOpenEvent.EVENT_NAME);
  }

  public override clone() {
    return new YatlDropdownOpenEvent();
  }
}

export class YatlDropdownCloseRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-close-request';
  constructor() {
    super(YatlDropdownCloseRequest.EVENT_NAME, { cancelable: true });
  }

  public override clone() {
    return new YatlDropdownCloseRequest();
  }
}

export class YatlDropdownCloseEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-close';
  constructor() {
    super(YatlDropdownCloseEvent.EVENT_NAME);
  }

  public override clone() {
    return new YatlDropdownCloseEvent();
  }
}

export class YatlDropdownSelectEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-select';
  constructor(public readonly item: YatlOption) {
    super(YatlDropdownSelectEvent.EVENT_NAME, { cancelable: true });
  }

  public override clone() {
    return new YatlDropdownSelectEvent(this.item);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlDropdownOpenRequest.EVENT_NAME]: YatlDropdownOpenRequest;
    [YatlDropdownOpenEvent.EVENT_NAME]: YatlDropdownOpenEvent;
    [YatlDropdownCloseRequest.EVENT_NAME]: YatlDropdownCloseEvent;
    [YatlDropdownCloseEvent.EVENT_NAME]: YatlDropdownCloseEvent;
    [YatlDropdownSelectEvent.EVENT_NAME]: YatlDropdownSelectEvent;
  }
}
