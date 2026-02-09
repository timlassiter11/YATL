import {
  NestedKeyOf,
  RowId,
  SortOrder,
  TableState,
  UnspecifiedRecord,
} from './types';
import { type YatlOption } from './yatl-option';

/**
 * Base event class that bubbles and is composed.
 */
export class YatlEvent extends Event {
  constructor(name: string, options: EventInit = {}) {
    super(name, {
      bubbles: true,
      composed: true,
      cancelable: false,
      ...options,
    });
  }
}

// #region Table Events

export class YatlRowClickEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-row-click';

  constructor(
    public readonly row: T,
    public readonly rowId: RowId,
    public readonly index: number,
    public readonly field: NestedKeyOf<T>,
    public readonly originalEvent: MouseEvent,
  ) {
    super(YatlRowClickEvent.EVENT_NAME);
  }
}

export class YatlRowSelectRequestEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-row-select-request';

  constructor(
    public readonly rowId: RowId,
    public readonly selected: boolean,
    public readonly currentlySelectedRows: RowId[],
  ) {
    super(YatlRowSelectRequestEvent.EVENT_NAME, { cancelable: true });
  }
}

export class YatlRowSelectEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-row-select';

  constructor(
    public readonly selectedIds: RowId[],
    public readonly previouslySelectedRows: RowId[],
  ) {
    super(YatlRowSelectEvent.EVENT_NAME);
  }
}

export class YatlColumnSortRequestEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-sort-request';

  constructor(
    public readonly field: NestedKeyOf<T>,
    public readonly order: SortOrder | null,
    public readonly multisort: boolean,
  ) {
    super(YatlColumnSortRequestEvent.EVENT_NAME, { cancelable: true });
  }
}

export class YatlColumnSortEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-sort';

  constructor(
    public readonly field: NestedKeyOf<T>,
    public readonly order: SortOrder | null,
    public readonly multisort: boolean,
  ) {
    super(YatlColumnSortEvent.EVENT_NAME);
  }
}

export class YatlColumnToggleRequestEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-toggle-request';
  constructor(
    public readonly field: string,
    public readonly visibility: boolean,
  ) {
    super(YatlColumnToggleRequestEvent.EVENT_NAME, { cancelable: true });
  }
}

export class YatlColumnToggleEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-toggle';

  constructor(
    public readonly field: NestedKeyOf<T>,
    public readonly visible: boolean,
  ) {
    super(YatlColumnToggleEvent.EVENT_NAME);
  }
}

export class YatlColumnResizeEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-resize';

  constructor(
    public readonly field: NestedKeyOf<T>,
    public readonly width: number | null,
  ) {
    super(YatlColumnResizeEvent.EVENT_NAME);
  }
}

export class YatlColumnReorderRequestEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-reorder-request';

  constructor(
    public readonly movedColumn: NestedKeyOf<T>,
    public readonly originalIndex: number,
    public readonly newIndex: number,
  ) {
    super(YatlColumnReorderRequestEvent.EVENT_NAME, { cancelable: true });
  }
}

export class YatlColumnReorderEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-reorder';

  constructor(public readonly order: NestedKeyOf<T>[]) {
    super(YatlColumnReorderEvent.EVENT_NAME);
  }
}

export class YatlTableSearchEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-table-search';

  constructor(public readonly query: string) {
    super(YatlTableSearchEvent.EVENT_NAME);
  }
}

export class YatlTableViewChangeEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-table-view-change';

  constructor(public readonly data: T[]) {
    super(YatlTableViewChangeEvent.EVENT_NAME);
  }
}

export class YatlTableStateChangeEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-table-state-change';

  constructor(
    public readonly state: TableState<T>,
    public readonly triggers: string[],
  ) {
    super(YatlTableStateChangeEvent.EVENT_NAME);
  }
}

// #endregion
// #region --- UI Events ---

export class YatlDropdownOpenRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-open-request';
  constructor() {
    super(YatlDropdownOpenRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlDropdownOpenEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-open';
  constructor() {
    super(YatlDropdownOpenEvent.EVENT_NAME);
  }
}

export class YatlDropdownCloseRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-close-request';
  constructor() {
    super(YatlDropdownCloseRequest.EVENT_NAME, { cancelable: true });
  }
}

export class YatlDropdownCloseEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-close';
  constructor() {
    super(YatlDropdownCloseEvent.EVENT_NAME);
  }
}

export class YatlDropdownSelectEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropdown-select';
  constructor(public readonly item: YatlOption) {
    super(YatlDropdownSelectEvent.EVENT_NAME, { cancelable: true });
  }
}

export class YatlToolbarSearchInput extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-toolbar-search-input';
  constructor(public readonly value: string) {
    super(YatlToolbarSearchInput.EVENT_NAME);
  }
}

export class YatlTagDismissEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-tag-dismiss';
  constructor() {
    super(YatlTagDismissEvent.EVENT_NAME);
  }
}

export class YatlToolbarSearchChange extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-toolbar-search-change';
  constructor(public readonly value: string) {
    super(YatlToolbarSearchChange.EVENT_NAME);
  }
}

export class YatlToolbarExportClick extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-toolbar-export-click';
  constructor() {
    super(YatlToolbarExportClick.EVENT_NAME);
  }
}

// #endregion

declare global {
  interface HTMLElementEventMap {
    [YatlRowClickEvent.EVENT_NAME]: YatlRowClickEvent;

    [YatlRowSelectRequestEvent.EVENT_NAME]: YatlRowSelectRequestEvent;
    [YatlRowSelectEvent.EVENT_NAME]: YatlRowSelectEvent;

    [YatlColumnSortRequestEvent.EVENT_NAME]: YatlColumnSortRequestEvent;
    [YatlColumnSortEvent.EVENT_NAME]: YatlColumnSortEvent;

    [YatlColumnToggleRequestEvent.EVENT_NAME]: YatlColumnToggleRequestEvent;
    [YatlColumnToggleEvent.EVENT_NAME]: YatlColumnToggleEvent;

    [YatlColumnResizeEvent.EVENT_NAME]: YatlColumnResizeEvent;

    [YatlColumnReorderRequestEvent.EVENT_NAME]: YatlColumnReorderRequestEvent;
    [YatlColumnReorderEvent.EVENT_NAME]: YatlColumnReorderEvent;

    [YatlTableSearchEvent.EVENT_NAME]: YatlTableSearchEvent;
    [YatlTableViewChangeEvent.EVENT_NAME]: YatlTableViewChangeEvent;
    [YatlTableStateChangeEvent.EVENT_NAME]: YatlTableStateChangeEvent;

    [YatlDropdownOpenRequest.EVENT_NAME]: YatlDropdownOpenRequest;
    [YatlDropdownOpenEvent.EVENT_NAME]: YatlDropdownOpenEvent;
    [YatlDropdownCloseRequest.EVENT_NAME]: YatlDropdownCloseEvent;
    [YatlDropdownCloseEvent.EVENT_NAME]: YatlDropdownCloseEvent;
    [YatlDropdownSelectEvent.EVENT_NAME]: YatlDropdownSelectEvent;

    [YatlTagDismissEvent.EVENT_NAME]: YatlTagDismissEvent;
    
    [YatlToolbarSearchInput.EVENT_NAME]: YatlToolbarSearchInput;
    [YatlToolbarSearchChange.EVENT_NAME]: YatlToolbarSearchChange;
    [YatlToolbarExportClick.EVENT_NAME]: YatlToolbarExportClick;
  }
}
