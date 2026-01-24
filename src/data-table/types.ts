import { NestedKeyOf } from './utils';


/**
 * Defines the possible sorting orders for columns.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Callback for conditionally adding classes to a row
 * @param row - The row data.
 * @returns the part string or list of part strings that should be added to this row.
 */
export type RowPartsCallback<T> = (row: T) => string | string[];

/**
 * Callback for conditionally adding classes to a cell
 * @param value - The value of the cell.
 * @param field - The field of the column.
 * @param row - The row data.
 */
export type CellPartsCallback<T> = (value: unknown, field: NestedKeyOf<T>, row: T) => string | string[];

/**
 * Callback for providing the full contents of a rendered cell.
 * @param value - The value of the cell.
 * @param field - The field of the column.
 * @param row - The row data.
 * @returns - Should return an HTMLElement or anything Lit can render
 */
export type CellRenderCallback<T> = (value: unknown, field: NestedKeyOf<T>, row: T) => unknown;

/**
 * Callback for formatting the value of a cell.
 * Called when the cell is created and when exporting to CSV.
 * @param value - The value of the cell.
 * @param row - The row data.
 */
export type ValueFormatterCallback<T> = (value: any, row: T) => string | null;

/**
 * Callback for comparing two values.
 * @param a - The first value.
 * @param b - The second value.
 * @returns A negative number if a < b, a positive number if a > b, or 0 if they are equal.
 */
export type ComparatorCallback = (a: any, b: any) => number;

/**
 * Callback for caching the sort value of a field
 * This function should derive a comparable value (often numerical or lowercase string) from the field's original value, to be used during sorting.
 * @param value - The value of the field.
 * @returns The derived value for sorting (e.g., a number or a standardized string).
 */
export type SortValueCallback = (value: any) => number | string;

/**
 * A filter object containing keys for the fields to be filtered,
 * and the values used to compare against.
 */
export type Filters<T> = Partial<{ [K in NestedKeyOf<T>]: any }>;

/**
 * A single query token derived from a larger string
 */
export interface QueryToken {
  /**
   * The value to use for the token
   */
  value: string;

  /**
   * If the token should be treated as quoted.
   * Quoted tokens are searched for exactly, no partial matches.
   */
  quoted: boolean;
}

/**
 * Callback for tokenizing a value into a list of string tokens.
 * @param value - The value to tokenize.
 * @returns An array of tokens.
 */
export type TokenizerCallback = (value: any) => QueryToken[];

/**
 * Callback for filtering a row.
 * @param row - The row data.
 * @param index - The index of the row.
 * @returns True if the row matches the filter, false otherwise.
 */
export type FilterCallback<T> = (row: T, index: number) => boolean;

/**
 * Callback for filtering a field value against the filter data.
 * @param value - The value to filter.
 * @param filter - The filter to apply.
 * @returns True if the value matches the filter, false otherwise.
 */
export type ColumnFilterCallback = (value: any, filter: any) => boolean;

/**
 * Represents the current sort state
 */
export interface SortState {
  /**
   * The sort order
   */
  order: SortOrder;
  /**
   * The sort priority.
   * Lower priority means
   */
  priority: number;
}

/**
 * Column options for the table.
 */
export interface ColumnOptions<T> {
  /**
   * The field name in the data object.
   */
  field: NestedKeyOf<T>;

  /**
   * The title to display in the header.
   */
  title?: string;

  /**
   * Whether the column is sortable.
   */
  sortable?: boolean;

  /**
   * Whether the column is searchable.
   */
  searchable?: boolean;

  /**
   * Whether the column's data should be tokenized for searching.
   */
  tokenize?: boolean;

  /**
   * Whether the column should be resizable.
   */
  resizable?: boolean;

  /**
   * A function for tokenizing this column's data.
   * Fallback to the main table tokenizer if not provided.
   */
  searchTokenizer?: TokenizerCallback;

  /**
   * A function to format the value for display.
   */
  valueFormatter?: ValueFormatterCallback<T>;

  /**
   * A function for conditinally adding classes to a cell.
   */
  cellParts?: CellPartsCallback<T>;

  /**
   * A function for rendering the contents of a cell.
   * NOTE: Search highlighting will not work for this cell when used.
   */
  cellRenderer?: CellRenderCallback<T>;

  /**
   * A function to use for sorting the column.
   * This overrides the default sorting behavior.
   */
  sorter?: ComparatorCallback;

  /**
   * A function to derive a comparable value from the cell's original value, specifically for sorting this column.
   * This can be used to preprocess and cache values (e.g., convert to lowercase, extract numbers) before comparison.
   */
  sortValue?: SortValueCallback;

  /**
   * A custom function to determine if a cell's value in this column matches a given filter criterion.
   * This is used when `DataTable.filter()` is called with an object-based filter that targets this column's field.
   */
  filter?: ColumnFilterCallback;
}

/**
 * Represents the current state of a column.
 */
export interface ColumnState<T> {
  /**
   * The unique field name of the column.
   */
  field: NestedKeyOf<T>;

  /**
   * The current visibility of the column.
   */
  visible: boolean;

  /**
   * The current sort order of the column.
   */
  sortState?: SortState | null;

  /**
   * The currently set width of the column in pixels.
   */
  width?: number | null;
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

  /**
   * The current column order represented as a list of their fields from left to right.
   */
  columnOrder: NestedKeyOf<T>[];
}

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

  /** Save the current column sorting */
  saveColumnSortOrders?: boolean;

  /** Save the current column visibility */
  saveColumnVisibility?: boolean;

  /** Save the current column widths */
  saveColumnWidths?: boolean;

  /** Save the current order of columns */
  saveColumnOrder?: boolean;
}

export type ColumnInitOptions<T> = ColumnOptions<T> & Partial<ColumnState<T>>;

export type RestorableColumnState<T> = Partial<Omit<ColumnState<T>, 'field'>> &
  Pick<ColumnState<T>, 'field'>;
export type RestorableTableState<T> = Partial<
  Omit<TableState<T>, 'columns'>
> & { columns?: RestorableColumnState<T>[] };

export type { NestedKeyOf };
