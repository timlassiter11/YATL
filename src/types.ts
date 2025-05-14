export type SortOrder = "asc" | "desc" | null;

/**
 * Callback for formatting a row's  HTML element.
 * @param row - The row data.
 * @param element - The row element.
 */
export type RowFormatterCallback = (row: any, element: HTMLElement) => void;

/**
 * Callback for formatting the value of a cell.
 * Called when the cell is created and when exporting to CSV.
 * @param value - The value of the cell.
 * @param row - The row data.
 */
export type ValueFormatterCallback = (value: any, row: object) => string;

/**
 * Callback for formatting a cell's HTML element.
 * @param value - The value of the field.
 * @param row - The row data.
 * @param element - The cell element.
 */
export type CellFormatterCallback = (
  value: any,
  row: object,
  element: HTMLElement
) => void;

/**
 * Callback for comparing two values.
 * @param a - The first value.
 * @param b - The second value.
 * @returns A negative number if a < b, a positive number if a > b, or 0 if they are equal.
 */
export type ComparatorCallback = (a: any, b: any) => number;

/**
 * Callback for caching the sort value of a field
 * @param value - The value of the field.
 * @returns The numerical value of the field
 */
export type SortValueCallback = (value: any) => number;

/**
 * Callback for tokenizing a value into a list of string tokens.
 * @param value - The value to tokenize.
 * @returns An array of tokens.
 */
export type TokenizerCallback = (value: any) => string[];

/**
 * Callback for filtering a row.
 * @param row - The row data.
 * @param index - The index of the row.
 * @returns True if the row matches the filter, false otherwise.
 */
export type FilterCallback = (row: object, index: number) => boolean;

/**
 * Callback for filtering a field value against the filter data.
 * @param value - The value to filter.
 * @param filter - The filter to apply.
 * @returns True if the value matches the filter, false otherwise.
 */
export type ColumnFilterCallback = (value: any, filter: any) => boolean;

/**
 * Column options for the table.
 */
export interface ColumnOptions {

  /**
   * The field name in the data object.
   */
  field: string;

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
   * The initial sort order of the column.
   */
  sortOrder?: SortOrder;

  /**
   * The inital sort priority of the column for sorting.
   * Lower numbers are sorted first.
   */
  sortPriority?: number;

  /**
   * Whether the column should be visible by default.
   */
  visible?: boolean;

  /**
   * Whether the column should be resizable.
   * Defaults to the table's resizable option.
   */
  resizable?: boolean;

  /**
   * The initial width of the column.
   * Can be a number (in pixels) or a string (e.g. "100px", "50%").
   */
  width?: string | number;

  /**
   * A function to format the value for display.
   */
  valueFormatter?: ValueFormatterCallback;

  /**
   * A function to format the element for display.
   */
  elementFormatter?: CellFormatterCallback;
  sorter?: (a: any, b: any) => number;
  filter?: FilterCallback;
}

export interface ColumnState {
  readonly field: string;
  readonly title: string;
  visible?: boolean;
  sortOrder?: SortOrder;
  sortPriority?: number;
  width?: string;
}

export interface TableClasses {
  scroller?: string | string[];
  thead?: string | string[];
  tbody?: string | string[];
  tfoot?: string | string[];
  tr?: string | string[];
  th?: string | string[];
  td?: string | string[];
}

export interface TableOptions {
  formatter?: RowFormatterCallback;
  columns?: ColumnOptions[];
  data?: any[];
  virtualScroll?: boolean | number;
  highlightSearch?: boolean;
  resizable?: boolean;
  rearrangeable?: boolean;
  extraSearchFields?: string[];
  noDataText?: string;
  noMatchText?: string;
  classes?: TableClasses;
  tokenizer?: TokenizerCallback;
}