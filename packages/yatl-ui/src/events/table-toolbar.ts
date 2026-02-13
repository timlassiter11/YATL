import { NestedKeyOf, UnspecifiedRecord, YatlEvent } from '@timlassiter11/yatl';

export class YatlToolbarSearchInput extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-toolbar-search-input';
  constructor(public readonly value: string) {
    super(YatlToolbarSearchInput.EVENT_NAME);
  }

  public override clone() {
    return new YatlToolbarSearchInput(this.value);
  }
}

export class YatlToolbarSearchChange extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-toolbar-search-change';
  constructor(public readonly value: string) {
    super(YatlToolbarSearchChange.EVENT_NAME);
  }

  public override clone() {
    return new YatlToolbarSearchChange(this.value);
  }
}

export class YatlToolbarExportClick extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-toolbar-export-click';
  constructor() {
    super(YatlToolbarExportClick.EVENT_NAME);
  }

  public override clone() {
    return new YatlToolbarExportClick();
  }
}

export class YatlColumnToggleRequest<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-toggle-request';
  constructor(
    public readonly field: NestedKeyOf<T>,
    public readonly visibility: boolean,
  ) {
    super(YatlColumnToggleRequest.EVENT_NAME, { cancelable: true });
  }

  public override clone() {
    return new YatlColumnToggleRequest<T>(this.field, this.visibility);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlToolbarSearchInput.EVENT_NAME]: YatlToolbarSearchInput;
    [YatlToolbarSearchChange.EVENT_NAME]: YatlToolbarSearchChange;
    [YatlToolbarExportClick.EVENT_NAME]: YatlToolbarExportClick;
    [YatlColumnToggleRequest.EVENT_NAME]: YatlColumnToggleRequest;
  }
}
