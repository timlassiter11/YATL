import { FilterCallback } from '../types';
import { ColumnState, RestorableColumnState } from './columns';
import { NestedKeyOf, RowId } from './common';
import { Filters } from './filters';

export type RowIdCallback<T> = (row: T, index: number) => RowId;

/**
 * The method used for selecting rows.
 * * single - Only a single row can be selected at a time
 * * multi - Multiple rows can be selected at a time
 * * null - Disable row selection
 */
export type RowSelectionMethod = 'single' | 'multi';

/**
 * Callback for conditionally adding classes to a row
 * @param row - The row data.
 * @returns the part string or list of part strings that should be added to this row.
 */
export type RowPartsCallback<T> = (row: T) => string | string[];

export interface StorageOptions {
  /**
   * The unique key used to store the table state in the browser.
   * * @example "my-app-users-table-v1"
   */
  key: string;

  /**
   * Which storage engine to use.
   * * 'local': Persists after browser is closed (Default).
   * * 'session': Cleared when tab is closed.
   */
  storage?: 'local' | 'session';

  /** Save the current search query */
  saveSearchQuery?: boolean;

  /** Save the current column sorting */
  saveColumnSortOrders?: boolean;

  /** Save the current column visibility */
  saveColumnVisibility?: boolean;

  /** Save the current column widths */
  saveColumnWidths?: boolean;

  /** Save the current order of columns */
  saveColumnOrder?: boolean;
}

/**
 * Represents the current state of the table
 */
export interface TableState<T> {
  /**
   * A list of {@link ColumnState}s representing all of the columns in the table.
   */
  columns: ColumnState<T>[];

  /**
   * The current query applied to the table or null if no query is applied.
   */
  searchQuery: string;

  /**
   * The current filters applied to the table or null if no filters are applied.
   */
  filters: Filters<T> | FilterCallback<T> | null;
}

export type RestorableTableState<T> = Partial<
  Omit<TableState<T>, 'columns'>
> & { columns?: RestorableColumnState<T>[] };

export interface ExportOptions {
  includeAllRows?: boolean;
  includeHiddenColumns?: boolean;
  includeInternalColumns?: boolean;
}
