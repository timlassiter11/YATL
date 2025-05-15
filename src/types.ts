/**
 * Defines the possible sorting orders for columns.
 */
export type SortOrder = "asc" | "desc" | null;

/**
 * Represents a generic data row in the table, an object with string keys and any values.
 */
export type Row = Record<string, any>;

/**
 * Callback for formatting a row's  HTML element.
 * @param row - The row data.
 * @param element - The row element.
 */
export type RowFormatterCallback = (row: Row, element: HTMLElement) => void;

/**
 * Callback for formatting the value of a cell.
 * Called when the cell is created and when exporting to CSV.
 * @param value - The value of the cell.
 * @param row - The row data.
 */
export type ValueFormatterCallback = (value: any, row: Row) => string;

/**
 * Callback for formatting a cell's HTML element.
 * @param value - The value of the field.
 * @param row - The row data.
 * @param element - The cell element.
 */
export type CellFormatterCallback = (
  value: any,
  row: Row,
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
 * This function should derive a comparable value (often numerical or lowercase string) from the field's original value, to be used during sorting.
 * @param value - The value of the field.
 * @returns The derived value for sorting (e.g., a number or a standardized string).
 */
export type SortValueCallback = (value: any) => number | string;

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
export type FilterCallback = (row: Row, index: number) => boolean;

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
   * The initial sort priority of the column for sorting.
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
   * @param value - The cell's value.
   * @param filterCriterion - The criterion provided for this column in the main filter object.
   */
  filter?: ColumnFilterCallback;
}

/** Represents the current state of a column, often used for saving and restoring column configurations. */
export interface ColumnState {
  /**
   * The unique field name of the column.
   */
  readonly field: string;

  /**
   * The user friendly title of the column.
   */
  readonly title: string;

  /**
   * The current visibility of the column.
   */
  visible?: boolean;

  /**
   * The current sort order of the column.
   */
  sortOrder?: SortOrder;

  /**
   * The current sort priority of the column.
   * Lower numbers are sorted first.
   */
  sortPriority?: number;

  /**
   * The currently set width of the column.
   */
  width?: string;
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
   * Classes for the tfoot element.
   */
  tfoot?: string | string[];

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
}

/**
 * Options for configuring the table.
 */
export interface TableOptions {
  /**
   * The column options for the table.
   */
  columns?: ColumnOptions[];

  /**
   * The initial data to load into the table.
   */
  data?: Row[];

  /**
   * Configures virtual scrolling.
   */
  virtualScroll?: boolean;

  /**
   * Whether to highlight search results in the table cells.
   */
  highlightSearch?: boolean;

  /**
   * Whether columns should be sortable by default.
   * Can be overridden on individual columns.
   */
  sortable?: boolean;

  /**
   * Whether columns should be searchable by default.
   * Can be overridden on individual columns.
   */
  searchable?: boolean;

  /**
   * Whether columns data should be tokenized for searching by default.
   * Can be overridden on individual columns.
   */
  tokenize?: boolean;

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
  extraSearchFields?: string[];

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
  rowFormatter?: RowFormatterCallback;

  /**
   * A function to use for tokenizing values for searching.
   */
  tokenizer?: TokenizerCallback;
}