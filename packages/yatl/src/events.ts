import {
  NestedKeyOf,
  RowId,
  SortOrder,
  TableState,
  UnspecifiedRecord,
} from './types';

/**
 * Base event class that bubbles and is composed.
 */
export abstract class YatlEvent extends Event {
  constructor(name: string, options: EventInit = {}) {
    super(name, {
      bubbles: true,
      composed: true,
      cancelable: false,
      ...options,
    });
  }

  public abstract clone(): YatlEvent;
}

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

  public override clone() {
    return new YatlRowClickEvent<T>(
      this.row,
      this.rowId,
      this.index,
      this.field,
      this.originalEvent,
    );
  }
}

export class YatlRowSelectRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-row-select-request';

  constructor(
    public readonly rowId: RowId,
    public readonly selected: boolean,
    public readonly currentlySelectedRows: RowId[],
  ) {
    super(YatlRowSelectRequest.EVENT_NAME, { cancelable: true });
  }

  public override clone() {
    return new YatlRowSelectRequest(
      this.rowId,
      this.selected,
      this.currentlySelectedRows,
    );
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

  public override clone() {
    return new YatlRowSelectEvent(
      this.selectedIds,
      this.previouslySelectedRows,
    );
  }
}

export class YatlColumnSortRequest<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-sort-request';

  constructor(
    public readonly field: NestedKeyOf<T>,
    public readonly order: SortOrder | null,
    public readonly multisort: boolean,
  ) {
    super(YatlColumnSortRequest.EVENT_NAME, { cancelable: true });
  }

  public override clone() {
    return new YatlColumnSortRequest<T>(this.field, this.order, this.multisort);
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

  public override clone() {
    return new YatlColumnSortEvent<T>(this.field, this.order, this.multisort);
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

  public override clone() {
    return new YatlColumnToggleEvent<T>(this.field, this.visible);
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

  public override clone() {
    return new YatlColumnResizeEvent<T>(this.field, this.width);
  }
}

export class YatlColumnReorderRequest<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-reorder-request';

  constructor(
    public readonly movedColumn: NestedKeyOf<T>,
    public readonly originalIndex: number,
    public readonly newIndex: number,
  ) {
    super(YatlColumnReorderRequest.EVENT_NAME, { cancelable: true });
  }

  public override clone() {
    return new YatlColumnReorderRequest<T>(
      this.movedColumn,
      this.originalIndex,
      this.newIndex,
    );
  }
}

export class YatlColumnReorderEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-column-reorder';

  constructor(public readonly order: NestedKeyOf<T>[]) {
    super(YatlColumnReorderEvent.EVENT_NAME);
  }

  public override clone() {
    return new YatlColumnReorderEvent<T>(this.order);
  }
}

export class YatlTableSearchEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-table-search';

  constructor(public readonly query: string) {
    super(YatlTableSearchEvent.EVENT_NAME);
  }

  public override clone() {
    return new YatlTableSearchEvent(this.query);
  }
}

export class YatlTableViewChangeEvent<
  T extends object = UnspecifiedRecord,
> extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-table-view-change';

  constructor(public readonly data: T[]) {
    super(YatlTableViewChangeEvent.EVENT_NAME);
  }

  public override clone() {
    return new YatlTableViewChangeEvent<T>(this.data);
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

  public override clone() {
    return new YatlTableStateChangeEvent<T>(this.state, this.triggers);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlRowClickEvent.EVENT_NAME]: YatlRowClickEvent;

    [YatlRowSelectRequest.EVENT_NAME]: YatlRowSelectRequest;
    [YatlRowSelectEvent.EVENT_NAME]: YatlRowSelectEvent;

    [YatlColumnSortRequest.EVENT_NAME]: YatlColumnSortRequest;
    [YatlColumnSortEvent.EVENT_NAME]: YatlColumnSortEvent;

    [YatlColumnToggleEvent.EVENT_NAME]: YatlColumnToggleEvent;

    [YatlColumnResizeEvent.EVENT_NAME]: YatlColumnResizeEvent;

    [YatlColumnReorderRequest.EVENT_NAME]: YatlColumnReorderRequest;
    [YatlColumnReorderEvent.EVENT_NAME]: YatlColumnReorderEvent;

    [YatlTableSearchEvent.EVENT_NAME]: YatlTableSearchEvent;
    [YatlTableViewChangeEvent.EVENT_NAME]: YatlTableViewChangeEvent;
    [YatlTableStateChangeEvent.EVENT_NAME]: YatlTableStateChangeEvent;
  }
}
