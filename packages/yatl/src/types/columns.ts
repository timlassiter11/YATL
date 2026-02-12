import { Compareable, NestedKeyOf, Renderable } from './common';
import { ColumnFilterCallback, TokenizerCallback } from './filters';

export type ColumnRole = 'display' | 'internal';

/**
 * Callback for conditionally adding classes to a cell
 * @param value - The value of the cell.
 * @param field - The field of the column.
 * @param row - The row data.
 */
export type CellPartsCallback<T> = (
  value: unknown,
  field: NestedKeyOf<T>,
  row: T,
) => string | string[];

/**
 * Callback for providing the full contents of a rendered cell.
 * @param value - The value of the cell.
 * @param field - The field of the column.
 * @param row - The row data.
 * @returns - Should return an HTMLElement or anything Lit can render
 */
export type CellRenderCallback<T> = (
  value: unknown,
  field: NestedKeyOf<T>,
  row: T,
) => Renderable;

/**
 * Callback for formatting the value of a cell.
 * Called when the cell is created and when exporting to CSV.
 * @param value - The value of the cell.
 * @param row - The row data.
 */
export type ValueFormatterCallback<T> = (
  value: unknown,
  row: T,
) => string | null;

/**
 * Callback for caching the sort value of a field
 * This function should derive a comparable value (often numerical or lowercase string) from the field's original value, to be used during sorting.
 * @param value - The value of the field.
 * @returns The derived value for sorting (e.g., a number or a standardized string).
 */
export type SortValueCallback = (value: unknown) => Compareable;

/**
 * Shared options between both internal and displayed columns.
 */
export interface BaseColumnOptions<T> {
  /**
   * The field name in the data object.
   */
  field: NestedKeyOf<T>;

  /**
   * Determines if a column is intended to be displayed,
   * or just for searching and filtering.
   */
  role?: ColumnRole;

  /**
   * Whether the column is sortable.
   */
  sortable?: boolean;

  /**
   * A function to use for sorting the column.
   * This overrides the default sorting behavior.
   */
  sorter?: SortValueCallback;

  /**
   * Whether the column is searchable.
   */
  searchable?: boolean;

  /**
   * Whether the column's data should be tokenized for searching.
   */
  tokenize?: boolean;

  /**
   * A function for tokenizing this column's data.
   * Fallback to the main table tokenizer if not provided.
   */
  searchTokenizer?: TokenizerCallback;

  /**
   * A custom function to determine if a cell's value in this column matches a given filter criterion.
   * This is used when `DataTable.filter()` is called with an object-based filter that targets this column's field.
   */
  filter?: ColumnFilterCallback;
}

/**
 * Column options for the table.
 */
export interface DisplayColumnOptions<T> extends BaseColumnOptions<T> {
  /**
   * Determines if a column is intended to be displayed,
   * or just for searching and filtering.
   */
  role?: 'display';

  /**
   * The title to display in the header.
   */
  title?: string;

  /**
   * Whether the column should be resizable.
   */
  resizable?: boolean;

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
}

/**
 * Internal column definition used for searching and filtering
 */
export interface InternalColumnOptions<T> extends BaseColumnOptions<T> {
  /**
   * Marks this column as internal-only.
   * It will be indexed for search and filtering, but strictly excluded from the UI.
   */
  role: 'internal';
}

export type ColumnOptions<T> =
  | DisplayColumnOptions<T>
  | InternalColumnOptions<T>;

/**
 * Defines the possible sorting orders for columns.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Represents the current sort state
 */
export type SortState = {
  /**
   * The sort order
   */
  order: SortOrder;
  /**
   * The sort priority. Lower number means higher priority.
   */
  priority: number;
};

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
  sort: SortState | null;

  /**
   * The currently set width of the column in pixels.
   */
  width: number | null;
}

/**
 * {@link ColumnState} with all properties optional except {@link ColumnState.field}
 */
export type RestorableColumnState<T> = Partial<Omit<ColumnState<T>, 'field'>> &
  Pick<ColumnState<T>, 'field'>;
