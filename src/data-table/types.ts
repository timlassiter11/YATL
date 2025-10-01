import { NestedKeyOf } from './utils';
import { IVirtualScrollConstructor } from '../virtual-scroll/types';

/**
 * Defines options for loading data into the table
 * */
export interface LoadOptions {
  /** If the data should replace or be added to the end of the current data */
  append?: boolean;
  /** If the current scroll position should be kepts */
  keepScroll?: boolean;
}

/**
 * Defines the possible sorting orders for columns.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Callback for formatting a row's  HTML element.
 * @param row - The row data.
 * @param element - The row element.
 */
export type RowFormatterCallback<T extends object> = (
  row: T,
  element: HTMLElement,
) => void;

/**
 * Callback for formatting the value of a cell.
 * Called when the cell is created and when exporting to CSV.
 * @param value - The value of the cell.
 * @param row - The row data.
 */
export type ValueFormatterCallback<T extends object> = (
  value: any,
  row: T,
) => string;

/**
 * Callback for formatting a cell's HTML element.
 * @param value - The value of the field.
 * @param row - The row data.
 * @param element - The cell element.
 */
export type CellFormatterCallback<T extends object> = (
  value: any,
  row: T,
  element: HTMLElement,
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
 * This function should derive a comparable value (often numerical or lowercase string) from the field's original value, to be used during sorting.
 * @param value - The value of the field.
 * @returns The derived value for sorting (e.g., a number or a standardized string).
 */
export type SortValueCallback = (value: any) => number | string;

/**
 * A filter object containing keys for the fields to be filtered,
 * and the values used to compare against.
 */
export type Filters<T extends object> = Partial<{ [K in keyof T]: any }>;

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
export type FilterCallback = (row: any, index: number) => boolean;

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
export interface ColumnOptions<T extends object> {
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
   * Whether the column should be visible by default.
   */
  visible?: boolean;

  /**
   * Whether the column should be resizable.
   * Defaults to the table's resizable option.
   */
  resizable?: boolean;

  /**
   * A function to format the value for display.
   */
  valueFormatter?: ValueFormatterCallback<T> | null;

  /**
   * A function to format the element for display.
   */
  elementFormatter?: CellFormatterCallback<T> | null;

  /**
   * A function to use for sorting the column.
   * This overrides the default sorting behavior.
   */
  sorter?: ComparatorCallback | null;

  /**
   * A function to derive a comparable value from the cell's original value, specifically for sorting this column.
   * This can be used to preprocess and cache values (e.g., convert to lowercase, extract numbers) before comparison.
   */
  sortValue?: SortValueCallback | null;

  /**
   * A custom function to determine if a cell's value in this column matches a given filter criterion.
   * This is used when `DataTable.filter()` is called with an object-based filter that targets this column's field.
   */
  filter?: ColumnFilterCallback | null;
}

/**
 * Defines CSS classes to be applied to different parts of the table.
 */
export interface TableClasses {
  /**
   * Classes for the scroller element.
   */
  scroller?: string | string[];

  /**
   * Classes for the thead element.
   */
  thead?: string | string[];

  /**
   * Classes for the tbody element.
   */
  tbody?: string | string[];

  /**
   * Classes for each table row element.
   */
  tr?: string | string[];

  /**
   * Classes for each header element.
   */
  th?: string | string[];

  /**
   * Classes for each cell element.
   */
  td?: string | string[];

  /**
   * Classes for the mark elements used to highligh search results.
   */
  mark?: string | string[];
}

/**
 * Options for configuring the table.
 */
export interface TableOptions<T extends object> {
  /**
   * Data to load into the table
   */
  data?: T[];
  /**
   * Configures virtual scrolling.
   */
  virtualScroll?: boolean | number;

  /**
   * Whether to highlight search results in the table cells.
   */
  highlightSearch?: boolean;

  /**
   * Whether the search query should be tokenized.
   */
  tokenizeSearch?: boolean;

  /**
   * Whether search results should be scored or not.
   * Scoring is very computationally expensive...
   */
  enableSearchScoring?: boolean;

  /**
   * Whether columns should be sortable by default.
   * Can be overridden on individual columns.
   */
  sortable?: boolean;

  /**
   * Whether columns should be resizable by default.
   * Can be overridden on individual columns.
   */
  resizable?: boolean;

  /**
   * Whether columns should be rearrangeable by drag and drop.
   */
  rearrangeable?: boolean;

  /**
   * Additional fields to include in the search.
   * Used for fields that are not displayed as columns.
   */
  extraSearchFields?: NestedKeyOf<T>[];

  /**
   * The text to display when there is no data in the table.
   */
  noDataText?: string;

  /**
   * The text to display when there are no matching records after filtering or searching.
   */
  noMatchText?: string;

  /**
   * Custom CSS classes to apply to various table elements.
   */
  classes?: TableClasses;

  /**
   * A function to format each row's HTML element.
   */
  rowFormatter?: RowFormatterCallback<T> | null;

  /**
   * A function to use for tokenizing values for searching.
   */
  tokenizer?: TokenizerCallback;

  virtualScrollClass?: IVirtualScrollConstructor;
}

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

/** Represents the current state of a column, often used for saving and restoring column configurations. */
export interface ColumnState<T extends object> {
  /**
   * The unique field name of the column.
   */
  field: NestedKeyOf<T>;

  /**
   * The user friendly title of the column.
   */
  title: string;

  /**
   * The current visibility of the column.
   */
  visible: boolean;

  /**
   * The current sort order of the column.
   */
  sortState: SortState | null;

  /**
   * The currently set width of the column.
   */
  width: string;
}

export interface TableState<T extends object> {
  columns: ColumnState<T>[];
  searchQuery?: string | RegExp;
  filters?: Filters<T> | FilterCallback;
  scrollPosition: { top: number; left: number };
  columnOrder: NestedKeyOf<T>[];
}

export type RestorableColumnState<T extends object> = Partial<
  Omit<ColumnState<T>, 'field'>
> &
  Pick<ColumnState<T>, 'field'>;
export type RestorableTableState<T extends object> = Partial<
  Omit<TableState<T>, 'columns'>
> & { columns?: RestorableColumnState<T>[] };
