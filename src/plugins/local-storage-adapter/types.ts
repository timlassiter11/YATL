import type { RestorableTableState, TableState } from '../../data-table/types';

export interface LocalStorageAdapterOptions {
  saveSearch?: boolean;
  saveColumnTitle?: boolean;
  saveColumnSorting?: boolean;
  saveColumnOrder?: boolean;
  saveColumnVisibility?: boolean;
  saveColumnWidth?: boolean;
}

export interface IDataTable<T extends object> extends EventTarget {
  getState(): TableState<T>;
  restoreState(state: RestorableTableState<T>): void;
}
