import { YatlTableController } from '../table-controller/table-controller';
import { ColumnOptions, ColumnState, RestorableColumnState } from './columns';
import { NestedKeyOf, RowId, UnspecifiedRecord } from './common';
import { FilterCallback, Filters } from './filters';
import { TokenizerCallback } from './search';

export type RowIdCallback<T extends object = UnspecifiedRecord> = (
  row: T,
  index: number,
) => RowId;

/**
 * The current editing mode of the table
 * * immediate - Data is commited to the table as soon as cell editing ends
 * * row - Data is commited to the table when editing leaves the current row
 * * batch - Data is not automatically commited. User must manually commit changes
 */
export type YatlTableCommitStrategy = 'immediate' | 'row' | 'batch';

/**
 * The method used to start cell editing
 * * click - A single click on an editable cell shows the editor
 * * dblclick - Double clicking on an editable cell shows the editor
 * * none - In-cell editing is completely disabled
 */
export type YatlTableEditTrigger = 'click' | 'dblclick' | 'none';

/**
 * The method used for selecting rows.
 * * single - Only a single row can be selected at a time
 * * multi - Multiple rows can be selected at a time
 * * null - Disable row selection
 */
export type RowSelectionMethod = 'single' | 'multi';

/**
 * A commit record describing the changes to a single row.
 */
export interface YatlCommitRecord<T extends object = UnspecifiedRecord> {
  /** The unique identifier for the row */
  rowId: RowId;

  /**
   * List of fields that changed during this transactions
   */
  changedFields: NestedKeyOf<T>[];

  /**
   * A read-only reference to the original, unedited row data.
   */
  originalRow: T;

  /**
   * A partial object of only the fields that changed and their new, parsed values.
   */
  changes: Partial<T>;

  /**
   * A new row object containing the originalRow with the 'changes' deeply applied.
   */
  mergedRow: T;
}

export interface YatlCommitTransaction<T extends object = UnspecifiedRecord> {
  id: string;
  records: YatlCommitRecord<T>[];
}

/**
 * Callback for conditionally adding classes to a row
 * @param row - The row data.
 * @returns the part string or list of part strings that should be added to this row.
 */
export type RowPartsCallback<T extends object = UnspecifiedRecord> = (
  row: T,
) => string | string[] | undefined;

export interface StorageInterface {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

/**
 * Options used to configure what state information
 * should be saved and restored automatically.
 */
export interface StorageOptions {
  /**
   * The unique key used to store the table state in the browser.
   * * @example "my-app-users-table-v1"
   */
  key: string;

  /** A storage client for getting and setting values. Defaults to window.localStorage */
  storage?: StorageInterface;

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

  /** Save the currently selected rows */
  saveSelectedRows?: boolean;
}

/**
 * Represents the current state of the table
 */
export interface TableState<T extends object = UnspecifiedRecord> {
  /**
   * A list of {@link ColumnState}s representing all of the columns in the table.
   */
  columns: ColumnState<T>[];

  /**
   * The current query applied to the table or null if no query is applied.
   */
  searchQuery: string;

  /**
   * Currently selected row IDs.
   */
  selectedRows: RowId[];
}

export type RestorableTableState<T extends object = UnspecifiedRecord> =
  Partial<Omit<TableState<T>, 'columns'>> & {
    columns?: RestorableColumnState<T>[];
  };

/**
 * Options for configuring what date should be exported.
 */
export interface ExportOptions {
  /** Include all rows including filtered out rows */
  includeAllRows?: boolean;
  /** Include columns that have been hidden */
  includeHiddenColumns?: boolean;
  /** Include columns marked as internal */
  includeInternalColumns?: boolean;
}

export interface YatlTableControllerApi<T extends object = UnspecifiedRecord> {
  /**
   * The definitions for the columns to be rendered.
   * This defines the field mapping, titles, sortability, and other static options.
   */
  columns: ColumnOptions<T>[];

  /**
   * The dynamic runtime state of the table's columns (visibility, width, and sort order).
   *
   * Unlike the static `columns` definitions, `columnStates` represents the current,
   * interactive state of the grid. This is primarily used for programmatic control,
   * or for saving and restoring user preferences (e.g., from `localStorage`).
   */
  columnStates: ColumnState<T>[];

  /**
   * The array of data objects to be displayed.
   * Objects must satisfy the `WeakKey` constraint (objects only, no primitives).
   */
  data: T[];

  /**
   * An optional set of criteria to filter the visible rows.
   * This runs **before** the global search query is applied.
   * * @example
   * // Shows rows where status is 'active' AND role is 'admin'
   * table.filters = { status: 'active', role: 'admin' };
   */
  filters: Filters<T> | null;

  /**
   * An optional custom filter function.
   * Provide this function to bypass the default filter logic.
   * @param row - The current data record being evaluated.
   * @param index - The original index of the row in the unfiltered dataset.
   * @param filters - The current active filter state (the `filters` object).
   * @returns `true` to keep the row in the `filteredData` results, `false` to exclude it.
   * @example
   * ```ts
   * controller.filterStrategy = (row, filters) => {
   * // Example: Custom global search across multiple columns
   * if (filters.globalSearch) {
   *  const term = filters.globalSearch.toLowerCase();
   *  if (
   *      !row.firstName.toLowerCase().includes(term) &&
   *      !row.lastName.toLowerCase().includes(term)
   *  ) {
   *      return false;
   *    }
   *  }
   *  // Example: Strict mathematical matching
   *  if (filters.minAge && row.age < filters.minAge) {
   *    return false;
   *  }
   *  return true;
   * };
   * ```
   */
  filterStrategy: FilterCallback<T> | null;

  /**
   * The current text string used to filter the table data.
   * Setting this property triggers a new search and render cycle.
   */
  searchQuery: string;

  /**
   * Enables tokenized search behavior.
   * When enabled, the search query is split into individual tokens using the
   * `searchTokenizer` function (defaults to splitting on whitespace).
   * A row is considered a match if **ANY** of the tokens appear in the searchable fields.
   */
  tokenizedSearch: boolean;

  /**
   * Enables weighted relevance scoring for search results.
   * When enabled, exact matches and prefix matches are ranked higher than substring matches.
   * Rows are sorted by their relevance score descending.
   */
  scoredSearch: boolean;

  /**
   * A function that splits the search query into tokens.
   * Only used if search tokenization is enabled.
   * @default whitespaceTokenizer
   */
  searchTokenizer: TokenizerCallback;

  /**
   * The row selection method to use.
   * * single - Only a single row can be selected at a time
   * * multi - Multiple rows can be selected at a time
   * * null - Disable row selection
   * @attr row-selection-method
   */
  rowSelectionMethod: RowSelectionMethod | null;

  /**
   * List of currently selected row indexes.
   * * **NOTE**: These indexes are based off the of
   * the original data array index, *not* the filtered data.
   */
  selectedRowIds: RowId[];

  /**
   * A callback function used to extract or generate a unique identifier for each row.
   *
   * A stable, unique ID is heavily relied upon by the grid engine for maintaining row selection
   * state, tracking row metadata, and ensuring optimal rendering performance within the virtual
   * scroller—especially when data is actively being sorted, filtered, or updated.
   *
   * **Default Behavior:** * If not provided, the table will automatically attempt to locate an `id`, `key`, or `_id`
   * property on the row data object. If none are found, it falls back to using the row's original
   * array index (which will trigger a console warning, as indices are inherently unstable during sorting).
   *
   * **Note:** Because this expects a JavaScript function, it is exposed strictly as a property
   * and does not have a corresponding HTML attribute. You must use the property binding syntax
   * (`.rowIdCallback`) in a Lit template.
   *
   * @example
   * ```html
   * * <yatl-table .rowIdCallback=${(row) => row.deviceUuid}></yatl-table>
   * ```
   *
   * @example
   * ```ts
   * // Programmatic assignment using a composite key
   * table.rowIdCallback = (row, index) => `${row.chassisId}-${row.slotNumber}`;
   * ```
   */
  rowIdCallback?: RowIdCallback<T>;

  /**
   * Configuration options for automatically saving and restoring table state
   * (column width, order, visibility, etc.) to the provided storage interface.
   */
  storageOptions: StorageOptions | null;
}

/**
 * Options for configuring a table controller
 */
export type TableControllerOptions<T extends object = UnspecifiedRecord> =
  Partial<YatlTableControllerApi<T>>;

export interface YatlTableApi<T extends object = UnspecifiedRecord>
  extends YatlTableControllerApi<T> {
  /**
   * The table controller to use for this table component.
   */
  controller: YatlTableController<T>;

  /**
   * When set, editing is completely disabled.
   */
  readonly: boolean;

  /**
   * Enables visual row striping
   */
  striped: boolean;

  /**
   * Default sortability for all columns.
   * Can be overridden by setting `sortable` on the specific column definition.
   *
   * **NOTE:** Changing this will not clear sorted column states.
   */
  sortable: boolean;

  /**
   * Default resizability for all columns.
   * Can be overridden by setting `resizable` on the specific column definition.
   *
   * **NOTE:** Changing this will not clear current column widths.
   */
  resizable: boolean;

  /**
   * Allows users to reorder columns by dragging and dropping headers.
   */
  reorderable: boolean;

  /**
   * When set, shows a column to the left of each row with its row number.
   */
  rowNumbers: boolean;

  /**
   * When set, only the visible rows are rendered to the DOM, significantly improving
   * performance for large datasets (1000+ rows).
   */
  virtualScroll: boolean;

  /**
   * Hides the built-in footer row which displays the current record count.
   * The footer content can be customized using the `slot="footer"` element.
   */
  hideFooter: boolean;

  /**
   * The string to display in a cell when the data value is `null` or `undefined`.
   */
  nullValuePlaceholder: string;

  /**
   * The message displayed when the `data` array is empty.
   */
  emptyMessage: string;

  /**
   * The message displayed when `data` exists but the current search/filter results in zero visible rows.
   */
  noResultsMessage: string;

  /**
   *
   */
  editTrigger: YatlTableEditTrigger;

  /**
   * A callback function to conditionally apply CSS parts to table rows.
   */
  rowParts: RowPartsCallback<T> | null;
}
