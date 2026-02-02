import { NestedKeyOf, RowId, SortOrder, TableState } from './types';

export class YatlEvent<T = unknown> extends CustomEvent<T> {
  constructor(name: string, detail: T, options: EventInit = {}) {
    super(name, {
      bubbles: true,
      composed: true,
      cancelable: false,
      ...options,
      detail,
    });
  }
}

export class YatlRowClickEvent<T> extends YatlEvent<{
  row: T;
  id: RowId;
  index: number;
  field: NestedKeyOf<T>;
  originalEvent: MouseEvent;
}> {
  public static readonly EVENT_NAME = 'yatl-row-click';

  constructor(
    row: T,
    id: RowId,
    index: number,
    field: NestedKeyOf<T>,
    originalEvent: MouseEvent,
  ) {
    super(YatlRowClickEvent.EVENT_NAME, {
      row,
      id,
      index,
      field,
      originalEvent,
    });
  }
}

export class YatlChangeEvent<T> extends YatlEvent<{ data: T[] }> {
  public static readonly EVENT_NAME = 'yatl-change';

  constructor(data: T[]) {
    super(YatlChangeEvent.EVENT_NAME, { data });
  }
}

export class YatlSortEvent<T> extends YatlEvent<{
  field: NestedKeyOf<T>;
  order: SortOrder | null;
}> {
  public static readonly EVENT_NAME = 'yatl-sort';

  constructor(field: NestedKeyOf<T>, order: SortOrder | null) {
    super(
      YatlSortEvent.EVENT_NAME,
      {
        field,
        order,
      },
      {
        cancelable: true,
      },
    );
  }
}

export class YatlColumnVisibilityChangeEvent<T> extends YatlEvent<{
  field: NestedKeyOf<T>;
  visible: boolean;
}> {
  public static readonly EVENT_NAME = 'yatl-column-visibility-change';

  constructor(field: NestedKeyOf<T>, visible: boolean) {
    super(
      YatlColumnVisibilityChangeEvent.EVENT_NAME,
      {
        field,
        visible,
      },
      {
        cancelable: true,
      },
    );
  }
}

export class YatlColumnResizeEvent<T> extends YatlEvent<{
  field: NestedKeyOf<T>;
  width: number;
}> {
  public static readonly EVENT_NAME = 'yatl-column-resize';

  constructor(field: NestedKeyOf<T>, width: number) {
    super(YatlColumnResizeEvent.EVENT_NAME, {
      field,
      width,
    });
  }
}

export class YatlColumnReorderEvent<T> extends YatlEvent<{
  draggedColumn: NestedKeyOf<T>;
  droppedColumn: NestedKeyOf<T>;
  order: NestedKeyOf<T>[];
}> {
  public static readonly EVENT_NAME = 'yatl-column-reorder';

  constructor(
    draggedColumn: NestedKeyOf<T>,
    droppedColumn: NestedKeyOf<T>,
    order: NestedKeyOf<T>[],
  ) {
    super(
      YatlColumnReorderEvent.EVENT_NAME,
      {
        draggedColumn,
        droppedColumn,
        order,
      },
      {
        cancelable: true,
      },
    );
  }
}

export class YatlSearchEvent extends YatlEvent<{ query: string }> {
  public static readonly EVENT_NAME = 'yatl-search';

  constructor(query: string) {
    super(YatlSearchEvent.EVENT_NAME, { query });
  }
}

export class YatlRowSelectEvent<T> extends YatlEvent<{
  row: T;
  selectedIds: RowId[];
}> {
  public static readonly EVENT_NAME = 'yatl-row-select';

  constructor(row: T, selectedIds: RowId[]) {
    super(
      YatlRowSelectEvent.EVENT_NAME,
      { row, selectedIds },
      { cancelable: true },
    );
  }
}

export class YatlStateChangeEvent<T> extends YatlEvent<{
  state: TableState<T>;
  triggers: string[];
}> {
  public static readonly EVENT_NAME = 'yatl-state-change';

  constructor(
    state: TableState<T>,
    public triggers: string[],
  ) {
    super(YatlStateChangeEvent.EVENT_NAME, { state, triggers });
  }
}
