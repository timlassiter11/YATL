import type {
  ColumnFilterCallback,
  ColumnOptions,
  ColumnState,
  DisplayColumnOptions,
  FilterCallback,
  Filters,
  NestedKeyOf,
  QueryToken,
  RestorableColumnState,
  RestorableTableState,
  RowId,
  RowIdCallback,
  RowPartsCallback,
  RowSelectionMethod,
  SortOrder,
  StorageOptions,
  TableState,
  TokenizerCallback,
  UnspecifiedRecord,
} from '../types';

import {
  createRegexTokenizer,
  createState,
  findColumn,
  isDisplayColumn,
  isInternalColumn,
  isRowIdType,
  isRowSelectionMethod,
  whitespaceTokenizer,
} from '../utils';

import {
  getNestedValue,
  getColumnStateChanges,
  highlightText,
  createRankMap,
} from './utils';

import { html, LitElement, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import '@lit-labs/virtualizer';
import { LitVirtualizer } from '@lit-labs/virtualizer';
import {
  YatlColumnReorderEvent,
  YatlColumnReorderRequestEvent,
  YatlColumnResizeEvent,
  YatlColumnSortEvent,
  YatlColumnSortRequestEvent,
  YatlColumnToggleEvent,
  YatlColumnToggleEvent as YatlColumnToggleRequestEvent,
  YatlRowClickEvent,
  YatlRowSelectEvent,
  YatlRowSelectRequestEvent,
  YatlTableSearchEvent,
  YatlTableStateChangeEvent,
  YatlTableViewChangeEvent,
} from '../events';
import theme from '../theme';
import styles from './yatl-table.styles';

// #region --- Constants ---

// Debounce between state saves
const STATE_SAVE_DEBOUNCE = 1000;

const DEFAULT_STORAGE_OPTIONS: Partial<StorageOptions> = {
  storage: 'local',
  saveColumnSortOrders: true,
  saveColumnVisibility: true,
  saveColumnWidths: true,
  saveColumnOrder: true,
};

// Properties that should trigger a save
const SAVE_TRIGGERS = new Set<keyof YatlTable>([
  'searchQuery',
  'filters',
  'columns',
  'columnOrder',
  'columnStates',
  'storageOptions',
]);

const MATCH_WEIGHTS = {
  EXACT: 100,
  PREFIX: 50,
  SUBSTRING: 10,
};

// #endregion

/**
 * A virtualized data table capable of handling complex sorting, filtering, and tokenized searching.
 *
 * @element yatl-table
 * @summary A high-performance grid engine for rugged environments.
 *
 * @fires yatl-row-click - Fired when a user clicks a row.
 * @fires yatl-row-select-request - Fired before the row selection changes. Cancellable
 * @fires yatl-row-select - Fired when the row selection changes.
 * @fires yatl-column-sort-request - Fired before a column sort order changes. Cancellable.
 * @fires yatl-column-sort - Fired when a column sort order changes.
 * @fires yatl-column-toggle-request - Fired before a column's visibility changes. Cancellable.
 * @fires yatl-column-toggle - Fired when a column's visibility changes.
 * @fires yatl-column-resize - Fired after a column has been resized by the user.
 * @fires yatl-column-reorder-request - Fired when the user drops a column into a new position. Cancellable.
 * @fires yatl-column-reorder - Fired after the column order changes.
 * @fires yatl-table-search - Fired when the search query is updated.
 * @fires yatl-table-view-change - Fired when the visible slice of data changes due to sorting, filtering, or data updates. Payload contains the processed rows.
 * @fires yatl-table-state-change - Fired when any persistable state (width, order, sort, query) changes. Used for syncing with local storage.
 */
@customElement('yatl-table')
export class YatlTable<
  T extends object = UnspecifiedRecord,
> extends LitElement {
  public static override styles = [theme, styles];

  @query('.table')
  private tableElement!: HTMLElement;
  @query('lit-virtualizer')
  private virtualizer?: LitVirtualizer;

  // #region --- State Data ---

  // Property data
  private _enableSearchTokenization = false;
  private _enableSearchScoring = false;
  // Original options passed by the user
  private _columns: ColumnOptions<T>[] = [];
  // Options mapped by field for faster lookup
  private _columnDefinitionMap = new Map<NestedKeyOf<T>, ColumnOptions<T>>();
  private _columnStateMap = new Map<NestedKeyOf<T>, Readonly<ColumnState<T>>>();
  private _columnOrder: NestedKeyOf<T>[] = [];
  private _rowSelectionMethod: RowSelectionMethod | null = null;
  private _selectedRowIds = new Set<RowId>();
  private _storageOptions: StorageOptions | null = null;
  private _rowIdCallback: RowIdCallback<T> = (row, index) => {
    if ('id' in row && isRowIdType(row.id)) return row.id;
    if ('key' in row && isRowIdType(row.key)) return row.key;
    if ('_id' in row && isRowIdType(row._id)) return row._id;
    warnMissingId();
    return index;
  };
  private _data: T[] = [];
  private _searchQuery = '';
  private _searchTokenizer: TokenizerCallback = whitespaceTokenizer;
  private _filters: Filters<T> | FilterCallback<T> | null = null;

  @state()
  private _filteredData: T[] = [];

  // Flag if we have already restored the state or not.
  private hasRestoredState = false;

  // save state debounce timer
  private saveTimer = 0;

  // Flags set when something changes that
  // requires the filter or sort logic to re-run.
  private filterDirty = false;
  private sortDirty = false;

  // The last time the data was updated.
  // For displaying in the footer only.
  private dataLastUpdate: Date | null = null;

  // Maps rows to their metadata
  private rowMetadata = new WeakMap<T, RowMetadata>();
  // Map row ids to their rows for faster lookup
  private idToRowMap = new Map<RowId, T>();
  // List of tokens created from the current query
  private queryTokens: QueryToken[] | null = null;
  // Column resize state
  private resizeState: {
    active: boolean;
    startX: number;
    startWidth: number;
    columnIndex: number;
    columnField: NestedKeyOf<T>;
    currentWidths: string[];
  } | null = null;

  // Column drag & drop state
  private dragColumn: NestedKeyOf<T> | null = null;

  // #endregion

  // #region --- Properties ---

  /**
   * Default sortability for all columns.
   * Can be overridden by setting `sortable` on the specific column definition.
   * * **NOTE:** Changing this will not clear sorted column states.
   * @default false
   */
  @property({ type: Boolean, attribute: 'sortable' })
  public sortable = false;

  /**
   * Default resizability for all columns.
   * Can be overridden by setting `resizable` on the specific column definition.
   * *  **NOTE:** Changing this will not clear current column widths.
   * @default false
   */
  @property({ type: Boolean, attribute: 'resizable' })
  public resizable = false;

  /**
   * Enables virtual scrolling for the table.
   * When enabled, only the visible rows are rendered to the DOM, significantly improving
   * performance for large datasets (1000+ rows).
   * @default false
   */
  @property({ type: Boolean, attribute: 'enable-virtual-scroll' })
  public enableVirtualScroll = false;

  /**
   * When enabled, text matching the current search query will be wrapped in `<mark>` tags.
   * This applies to all visible cells that contain the search term.
   * This does NOT apply to content rendered by the user such as the ColumnOptions.render callback.
   * @default true
   */
  @property({ type: Boolean, attribute: 'enable-search-highlight' })
  public enableSearchHighlight = true;

  /**
   * Enables tokenized search behavior.
   * When enabled, the search query is split into individual tokens using the
   * `searchTokenizer` function (defaults to splitting on whitespace).
   * A row is considered a match if **ANY** of the tokens appear in the searchable fields.
   * @default false
   */
  @property({ type: Boolean, attribute: 'enable-search-tokenization' })
  public get enableSearchTokenization() {
    return this._enableSearchTokenization;
  }

  public set enableSearchTokenization(enable) {
    if (this._enableSearchTokenization === enable) {
      return;
    }

    const oldValue = this._enableSearchTokenization;
    this._enableSearchTokenization = enable;
    this.updateInternalQuery();
    this.filterDirty = true;
    this.requestUpdate('enableSearchTokenization', oldValue);
  }

  /**
   * Enables weighted relevance scoring for search results.
   * When enabled, exact matches and prefix matches are ranked higher than substring matches.
   * Rows are sorted by their relevance score descending.
   * @default false
   */
  @property({ type: Boolean, attribute: 'enable-search-scoring' })
  public get enableSearchScoring() {
    return this._enableSearchScoring;
  }

  public set enableSearchScoring(enable) {
    if (this._enableSearchScoring === enable) {
      return;
    }

    const oldValue = this._enableSearchScoring;
    this._enableSearchScoring = enable;
    this.filterDirty = true;
    this.requestUpdate('enableSearchScoring', oldValue);
  }

  /**
   * Allows users to reorder columns by dragging and dropping headers.
   * @default true
   */
  @property({ type: Boolean, attribute: 'enable-column-reorder' })
  public enableColumnReorder = true;

  /**
   * Shows a column to the left of each row with its row number.
   */
  @property({ type: Boolean })
  public enableRowNumberColumn = false;

  /**
   * Shows the built-in footer row which displays the current record count.
   * The footer content can be customized using the `slot="footer"` element.
   * @default false
   */
  @property({ type: Boolean, attribute: 'enable-footer' })
  public enableFooter = false;

  /**
   * The string to display in a cell when the data value is `null` or `undefined`.
   * @default "-"
   */
  @property({ type: String, attribute: 'null-value-placeholder' })
  public nullValuePlaceholder = '-';

  /**
   * The message displayed when the `data` array is empty.
   * @default "No records to display"
   */
  @property({ type: String, attribute: 'empty-message' })
  public emptyMessage = 'No records to display';

  /**
   * The message displayed when `data` exists but the current search/filter
   * results in zero visible rows.
   * @default "No matching records found"
   */
  @property({ type: String, attribute: 'no-results-message' })
  public noResultsMessage = 'No matching records found';

  /**
   * The definitions for the columns to be rendered.
   * This defines the field mapping, titles, sortability, and other static options.
   */
  @property({ attribute: false })
  public get columns() {
    return this._columns;
  }

  public set columns(columns) {
    if (this._columns === columns) {
      return;
    }

    const oldValue = this._columns;
    this._columns = columns;
    this.filterDirty = true;
    // Cache these in a map for faster lookups
    this._columnDefinitionMap = new Map();
    for (const column of columns) {
      this._columnDefinitionMap.set(column.field, column);
    }
    this.requestUpdate('columns', oldValue);
  }

  /**
   * Gets a list of columns with the display role
   * **This will always be ordered by {@link YatlTable.columnOrder}**
   */
  public get displayColumns() {
    return this.columnOrder
      .map(field => this._columnDefinitionMap.get(field))
      .filter(isDisplayColumn);
  }

  /**
   * The current order of the columns.
   * * **NOTE:** This includes hidden columns but not internal columns
   */
  @property({ attribute: false })
  public get columnOrder() {
    // Augment the column order with missing columns
    // from the normal column list.
    const finalOrder = new Set<NestedKeyOf<T>>();
    for (const field of this._columnOrder) {
      const col = this.getDisplayColumn(field);
      if (col) {
        finalOrder.add(field);
      }
    }

    for (const col of this.columns) {
      if (isDisplayColumn(col) && !finalOrder.has(col.field)) {
        finalOrder.add(col.field);
      }
    }
    return [...finalOrder];
  }

  public set columnOrder(columns) {
    if (this._columnOrder === columns) {
      return;
    }

    const oldValue = this._columnOrder;
    this._columnOrder = [...columns];
    this.requestUpdate('columnOrder', oldValue);
  }

  @property({ attribute: false })
  public get columnStates() {
    return this.columnOrder.map(field => {
      const column = this.getDisplayColumn(field);
      const state = this.getOrCreateColumnState(field);
      // Always return a copy so the user can't modify it.
      return createState(field, { ...state, title: column?.title });
    });
  }

  public set columnStates(states) {
    const oldValue = this.columnStates;

    let changed = false;
    for (const state of states) {
      const oldState = this.getColumnState(state.field);
      const stateChanges = getColumnStateChanges(oldState, state);
      if (stateChanges.length) {
        changed = true;
        if (stateChanges.includes('sort')) {
          this.sortDirty = true;
        }

        const newState = createState(state.field, state);
        this._columnStateMap.set(state.field, newState);
      }
    }

    if (!changed) {
      return;
    }

    this.requestUpdate('columnStates', oldValue);
  }

  /**
   * The current text string used to filter the table data.
   * Setting this property triggers a new search and render cycle.
   */
  @property({ type: String, attribute: 'search-query' })
  public get searchQuery() {
    return this._searchQuery;
  }

  public set searchQuery(query) {
    if (this._searchQuery === query) {
      return;
    }

    const oldValue = this._searchQuery;
    this._searchQuery = query;
    this.updateInternalQuery();
    this.filterDirty = true;
    this.requestUpdate('searchQuery', oldValue);
  }

  /**
   * A function that splits the search query into tokens.
   * Only used if `enableSearchTokenization` is true.
   * @default whitespaceTokenizer
   */
  @property({ attribute: false })
  public get searchTokenizer() {
    return this._searchTokenizer;
  }

  public set searchTokenizer(tokenizer) {
    if (this._searchTokenizer === tokenizer) {
      return;
    }

    const oldValue = this._searchTokenizer;
    this._searchTokenizer = tokenizer;
    this.filterDirty = true;
    this.requestUpdate('searchTokenizer', oldValue);
  }

  /**
   * An optional set of criteria to filter the visible rows.
   * This runs **before** the global search query is applied.
   * * You can provide:
   * 1. A **Partial Object**: matches rows where specific keys equal specific values (AND logic).
   * 2. A **Callback Function**: returns `true` to keep the row, `false` to hide it.
   * * @example
   * // 1. Object Syntax (Simple Exact Match)
   * // Shows rows where status is 'active' AND role is 'admin'
   * table.filters = { status: 'active', role: 'admin' };
   * * @example
   * // 2. Callback Syntax (Complex Logic)
   * // Shows rows where age is over 21 OR they are a VIP
   * table.filters = (row) => row.age > 21 || row.isVip;
   */
  @property({ attribute: false })
  public get filters() {
    return this._filters;
  }

  public set filters(filters) {
    if (this._filters === filters) {
      return;
    }

    const oldValue = this._filters;
    this._filters = filters;
    this.filterDirty = true;
    this.requestUpdate('filters', oldValue);
  }

  /**
   * A callback function to conditionally apply CSS parts to table rows.
   */
  @property({ attribute: false })
  public rowParts: RowPartsCallback<T> | null = null;

  /**
   * The row selection method to use.
   * * single - Only a single row can be selected at a time
   * * multi - Multiple rows can be selected at a time
   * * null - Disable row selection
   */
  @property({ type: String })
  public get rowSelectionMethod() {
    return this._rowSelectionMethod;
  }
  public set rowSelectionMethod(selection) {
    if (
      this._rowSelectionMethod === selection ||
      !isRowSelectionMethod(selection)
    ) {
      return;
    }

    const oldValue = this._rowSelectionMethod;
    this._rowSelectionMethod = selection;
    if (selection === 'single') {
      this.selectedRowIds = this.selectedRowIds.slice(0, 1);
    } else if (!selection) {
      this.selectedRowIds = [];
    }
    this.requestUpdate('rowSelectionMethod', oldValue);
  }

  /**
   * List of currently selected row indexes.
   * * **NOTE**: These indexes are based off the of
   * the original data array index, *not* the filtered data.
   */
  @property({ attribute: false })
  public get selectedRowIds() {
    return [...this._selectedRowIds];
  }

  public set selectedRowIds(rows) {
    if (
      rows.length === this._selectedRowIds.size &&
      rows.every(a => this._selectedRowIds.has(a))
    ) {
      return;
    }

    if (this.rowSelectionMethod === 'single') {
      rows = rows.slice(0, 1);
    } else if (!this.rowSelectionMethod) {
      rows = [];
    }

    const oldValue = this.selectedRowIds;
    this._selectedRowIds = new Set(rows);
    this.requestUpdate('selectedRowIds', oldValue);
  }

  /**
   * Configuration options for automatically saving and restoring table state
   * (column width, order, visibility, etc.) to browser storage.
   */
  @property({ type: Object, attribute: 'storage-options' })
  public get storageOptions() {
    return this._storageOptions;
  }

  public set storageOptions(options) {
    if (this._storageOptions === options) {
      return;
    }

    const oldValue = this._storageOptions;
    this._storageOptions = options;
    if (!this.hasRestoredState) {
      this.loadStateFromStorage();
    }
    this.requestUpdate('storageOptions', oldValue);
  }

  @property({ attribute: false })
  public get rowIdCallback() {
    return this._rowIdCallback;
  }

  public set rowIdCallback(callback) {
    if (this._rowIdCallback === callback) {
      return;
    }

    const oldValue = this._rowIdCallback;
    this._rowIdCallback = callback;
    // Update IDs in metadata for existing data.
    for (let i = 0; i < this.data.length; ++i) {
      const row = this.data[i];
      this.rowMetadata.get(row)!.id = this._rowIdCallback(row, i);
    }
    this.requestUpdate('rowIdCallback', oldValue);
  }

  /**
   * The array of data objects to be displayed.
   * Objects must satisfy the `WeakKey` constraint (objects only, no primitives).
   */
  @property({ attribute: false })
  public get data() {
    return this._data;
  }

  public set data(value: T[]) {
    const oldValue = this._data;
    this._data = value;
    this.dataLastUpdate = new Date();
    this.selectedRowIds = [];
    this.createMetadata();
    this.filterDirty = true;
    this.requestUpdate('data', oldValue);
  }

  get filteredData() {
    if (this.filterDirty) {
      this.filterRows();
    } else if (this.sortDirty) {
      this.sortRows();
    }

    this.filterDirty = false;
    this.sortDirty = false;

    return [...this._filteredData];
  }

  // #endregion

  // #region --- Public Methods ---

  public getColumn(field: NestedKeyOf<T>) {
    return this._columnDefinitionMap.get(field);
  }

  public getDisplayColumn(field: NestedKeyOf<T>) {
    const column = this._columnDefinitionMap.get(field);
    if (column && isDisplayColumn(column)) {
      return column;
    }
  }

  /**
   * Gets a copy of the current state of the table.
   */
  public getTableState(): TableState<T> {
    return {
      searchQuery: this.searchQuery,
      filters: this.filters,
      columnOrder: this.columnOrder,
      columns: this.columns.map(column => {
        const state = this.getOrCreateColumnState(column.field);
        // Always return a copy so the user can't modify it
        return createState(column.field, state);
      }),
    };
  }

  /**
   * Restores the table to the provided state.
   * @param state - The state to restore the table to.
   */
  public updateTableState(state: RestorableTableState<T>) {
    if ('searchQuery' in state && state.searchQuery !== undefined) {
      this.searchQuery = state.searchQuery;
    }

    if ('filters' in state && state.filters !== undefined) {
      this.filters = state.filters;
    }

    if ('columnOrder' in state && state.columnOrder !== undefined) {
      this.columnOrder = state.columnOrder;
    }

    if ('columns' in state && state.columns !== undefined) {
      for (const newState of state.columns) {
        this.updateColumnState(newState.field, newState);
      }
      this.requestUpdate();
    }
  }

  public getColumnState(field: NestedKeyOf<T>) {
    return createState(field, this._columnStateMap.get(field));
  }

  public updateColumnState(
    field: NestedKeyOf<T>,
    state: RestorableColumnState<T>,
  ) {
    const currentState = this._columnStateMap.get(field);
    const newState = createState(field, { ...currentState, ...state });
    this.columnStates = [newState];
  }

  /**
   * Sorts the table by a specified column and order.
   * If `order` is `null`, the sort on this column is removed.
   * @param field - The field name of the column to sort by.
   * @param order - The sort order: 'asc', 'desc', or `null` to remove sorting for this column.
   * @param clear - Clear all other sorting
   */
  public sort(
    field: NestedKeyOf<T>,
    order: SortOrder | null,
    clear: boolean = true,
  ) {
    const state = this.getColumnState(field);
    if (state === undefined) {
      throw new Error(`Cannot get options for non-existent column "${field}"`);
    }

    if (order === state?.sort?.order) {
      return;
    }

    const requestEvent = new YatlColumnSortRequestEvent(field, order);
    if (!this.dispatchEvent(requestEvent)) {
      return;
    }

    // Column was unsorted, give it a new priority
    if (order && !state.sort) {
      // Create a list of current sort priorities
      const priorities = [...this._columnStateMap.values()]
        .map(state => state.sort?.priority)
        .filter(priority => priority !== undefined);

      const maxPriority = this.columns.length + 1;
      const priority = Math.min(maxPriority, ...priorities) - 1;
      state.sort = { order, priority };
    } else if (order && state.sort) {
      // Column was sorted, just updated the order
      state.sort.order = order;
    } else {
      state.sort = null;
    }

    const newStates = [state];
    // Clear all other sorting
    if (clear) {
      for (const otherField of this.columnOrder) {
        if (otherField !== field) {
          const otherState = this.getColumnState(otherField);
          otherState.sort = null;
          newStates.push(otherState);
        }
      }
    }

    this.columnStates = newStates;
  }

  /**
   * Toggles the visibility of hte specified column
   * @param field - The field name of the column to toggle.
   * @param visible - Optionally force the visibility state.
   */
  public toggleColumnVisibility(field: NestedKeyOf<T>, visible?: boolean) {
    const state = this.getColumnState(field);
    const newVisibility = visible !== undefined ? visible : !state.visible;

    if (newVisibility === state.visible) {
      return;
    }

    const requestEvent = new YatlColumnToggleRequestEvent(field, newVisibility);
    if (!this.dispatchEvent(requestEvent)) {
      return;
    }

    state.visible = newVisibility;
    this.columnStates = [state];
  }

  /**
   * Shows the specified column
   * @param field - The field name of the column to show.
   */
  public showColumn(field: NestedKeyOf<T>) {
    this.toggleColumnVisibility(field, true);
  }

  /**
   * Hides the specified column
   * @param field - The field name of the column to hide.
   */
  public hideColumn(field: NestedKeyOf<T>) {
    this.toggleColumnVisibility(field, false);
  }

  /**
   * Moves a column to a new position
   * @param field - The column to move
   * @param newPosition The index or field of the column to move it to.
   * @returns
   */
  public moveColumn(
    field: NestedKeyOf<T>,
    newPosition: number | NestedKeyOf<T>,
  ) {
    const newColumnOrder = this.columnOrder;
    const dragIndex = newColumnOrder.findIndex(col => col === this.dragColumn);
    const dropIndex =
      typeof newPosition === 'number'
        ? newPosition
        : newColumnOrder.findIndex(col => col === newPosition);

    if (dragIndex > -1 && dropIndex > -1) {
      const [draggedColumn] = newColumnOrder.splice(dragIndex, 1);
      const droppedColumn = this.getColumn(field);
      if (!droppedColumn) return;

      newColumnOrder.splice(dropIndex, 0, draggedColumn);
      const requestEvent = new YatlColumnReorderRequestEvent(
        draggedColumn,
        droppedColumn.field,
        newColumnOrder,
      );
      if (!this.dispatchEvent(requestEvent)) {
        return;
      }

      this.columnOrder = newColumnOrder;
    }
  }

  public isRowSelected(row: T) {
    const rowId = this.getRowId(row);
    return this.selectedRowIds.includes(rowId);
  }

  /**
   * Toggles the selection state of a specific row.
   */
  public toggleRowSelection(row: T, state?: boolean) {
    const rowId = this.getRowId(row);

    const isSelected = this.isRowSelected(row);
    const newSelectionState = state !== undefined ? state : isSelected;

    if (newSelectionState === isSelected) {
      return;
    }

    let newSelection: RowId[];
    if (newSelectionState) {
      newSelection =
        this.rowSelectionMethod === 'single'
          ? [rowId]
          : [...this.selectedRowIds, rowId];
    } else {
      newSelection = this.selectedRowIds.filter(
        existingId => existingId !== rowId,
      );
    }

    const requestEvent = new YatlRowSelectRequestEvent(newSelection);
    if (!this.dispatchEvent(requestEvent)) {
      return;
    }

    this.selectedRowIds = newSelection;
  }

  /**
   * Selects a specific row.
   */
  public selectRow(row: T) {
    this.toggleRowSelection(row, true);
  }

  /**
   * Deselects a specific row.
   */
  public deselectRow(row: T) {
    this.toggleRowSelection(row, false);
  }

  /**
   * Selects all currently visible rows (for "Select All" checkbox).
   */
  public selectAll() {
    if (this.rowSelectionMethod === 'single') return;

    // Use visible rows (filtered) or all rows depending on your UX preference
    const allIds = this.filteredData.map(row => this.getRowId(row));

    const requestEvent = new YatlRowSelectRequestEvent(allIds);
    if (!this.dispatchEvent(requestEvent)) {
      return;
    }

    this.selectedRowIds = allIds;
  }

  /**
   * Clears all selection.
   */
  public deselectAll() {
    const requestEvent = new YatlRowSelectRequestEvent([]);
    if (!this.dispatchEvent(requestEvent)) {
      return;
    }

    this.selectedRowIds = [];
  }

  /**
   * Export the current visible table data to a CSV file.
   * @param filename - The name of the file to save.
   * @param all - If `true`, exports all original data (ignoring filters). If `false` (default), exports only the currently visible (filtered and sorted) rows.
   */
  public export(filename: string, all = false) {
    const data = all ? this.data : this.filteredData;

    const columnData = this.displayColumns;
    const csvHeaders = columnData
      .filter(
        column => all || this.getOrCreateColumnState(column.field).visible,
      )
      .map(column => `"${column.title}"`)
      .join(',');

    const csvRows = data
      .map(row => {
        const list: string[] = [];
        for (const column of columnData) {
          const state = this.getOrCreateColumnState(column.field);
          let value = getNestedValue(row, column.field);
          if (all || state.visible) {
            if (typeof column.valueFormatter === 'function') {
              value = column.valueFormatter(value, row);
            }
            value = String(value).replace('"', '""');
            list.push(`"${value}"`);
          }
        }
        return list.join(',');
      })
      .join('\n');

    const csvContent = csvHeaders + '\n' + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' });
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
  }

  public scrollToRow(row: T) {
    const index = this.data.findIndex(v => v === row);
    if (typeof index === 'number') {
      return this.scrollToOriginalIndex(index);
    } else {
      throw new Error('Row not in table');
    }
  }

  /**
   * Scrolls the table to bring the row at the specified original index into view.
   * @param index - The original index of the row (from the initial dataset).
   */
  public scrollToOriginalIndex(index: number) {
    const rowData = this.data[index];
    if (rowData) {
      const filteredIndex = this.filteredData.indexOf(rowData);
      if (filteredIndex >= 0) {
        return this.scrollToFilteredIndex(filteredIndex);
      } else {
        throw new Error('Cannot scroll to filtered out row');
      }
    } else {
      throw new RangeError(`Row index ${index} out of range`);
    }
  }

  public async scrollToFilteredIndex(index: number) {
    // FIXME: Scrolling to an index using lit-virtualizer is buggy.
    // It usually stops short of the requested index.
    // The amount it stops short seems to be proportinal to how far away the index is.
    // Scrolling without VS works but since I use sticky headers, it seems to be one row off.

    const rowData = this.filteredData[index];
    if (!rowData) {
      throw new RangeError(`Row index ${index} out of range`);
    }

    await this.updateComplete;

    // TODO: Should I check if virtual scroll is enabled
    // or just rely on the appropriate elements existing?
    if (this.virtualizer) {
      this.virtualizer.element(index)?.scrollIntoView({
        block: 'start',
        behavior: 'instant',
      });
    } else {
      const row = this.tableElement.querySelector(
        `.row[data-filtered-index="${index}"]`,
      );
      row?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }
  }

  public async scrollToPx(px: number) {
    // FIXME: This doesn't work with lit-virtualizer at all.

    await this.updateComplete;

    if (this.virtualizer) {
      this.virtualizer.scrollTop = px;
    } else {
      this.tableElement.scrollTop = px;
    }
  }

  /**
   * Gets the row associated with the provided ID.
   * @param id - The ID of the row to get
   * @returns
   */
  public getRow(id: RowId) {
    return this.idToRowMap.get(id);
  }

  /**
   * Finds the first row where {@link field} matches {@link value}
   * @param field - The field name within the row data to search.
   * @param value - The value to match against the field's content.
   * @returns The found row, or undefined if no match is found.
   */
  public findRow(field: NestedKeyOf<T>, value: unknown) {
    return this.data.find(row => {
      const rowValue = getNestedValue(row, field);
      return rowValue === value;
    });
  }

  /**
   * Finds the original index of the first row where the specified field matches the given value.
   * This searches through the original, unfiltered dataset.
   * @param field - The field name within the row data to search.
   * @param value - The value to match against the field's content.
   * @returns The original index of the found row, or -1 if no match is found.
   * @example
   * ```ts
   * const index = dataTable.indexOf('id', 12345);
   * if (index >= 0) {
   *  dataTable.updateRow({description: "Updated description"}, index);
   * }
   * ```
   */
  public findRowIndex(field: NestedKeyOf<T>, value: unknown) {
    const row = this.findRow(field, value);
    if (row) {
      return this.rowMetadata.get(row)!.index;
    }
    return -1;
  }

  public updateRow(rowId: RowId, data: Partial<T>) {
    const row = this.idToRowMap.get(rowId);
    if (row) {
      Object.assign(row, data);
      this.requestUpdate('data');
    }
  }

  /**
   * Updates the data of a row at a specific original index.
   * @param index - The original index of the row to update.
   * @param data - An object containing the new data to assign to the row. Existing fields will be updated, and new fields will be added.
   *
   * @example
   * ```ts
   * const index = dataTable.indexOf('id', 12345);
   * if (index >= 0) {
   *  dataTable.updateRow(index, {description: "Updated description"});
   * }
   * ```
   */
  public updateRowAtIndex(index: number, data: Partial<T>) {
    const row = this.data[index];
    if (row) {
      Object.assign(row, data);
      this.requestUpdate('data');
    }
  }

  /**
   * Deletes the row with the matching ID.
   * @param id - The ID of the row to delete
   */
  public deleteRow(...rowIds: RowId[]) {
    for (const rowId of rowIds) {
      const row = this.idToRowMap.get(rowId);
      if (row) {
        const metadata = this.rowMetadata.get(row)!;
        this.deleteRowAtIndex(metadata.index);
      }
    }
  }

  /**
   * Deletes a row at a specific original index from the table.
   * @param index - The original index of the row to delete.
   */
  public deleteRowAtIndex(index: number) {
    const row = this.data[index];
    if (row) {
      const metadata = this.rowMetadata.get(row)!;
      this.idToRowMap.delete(metadata.id);
      this.rowMetadata.delete(row);
      this._selectedRowIds.delete(metadata.id);
      this.selectedRowIds = [...this._selectedRowIds];
      this.data = this.data.toSpliced(index, 1);
    }
  }

  // #endregion

  // #region --- Render Methods ---

  protected renderColumnSortIcon(
    column: DisplayColumnOptions<T>,
    state: ColumnState<T>,
  ) {
    return (column.sortable ?? this.sortable)
      ? html`<div
          part="header-sort-icon"
          class=${classMap({
            'sort-icon': true,
            ascending: state.sort?.order === 'asc',
            descending: state.sort?.order === 'desc',
          })}
        ></div>`
      : nothing;
  }

  protected renderColumnResizer(
    column: DisplayColumnOptions<T>,
    _state: ColumnState<T>,
  ) {
    return (column.resizable ?? this.resizable)
      ? html`
          <div
            part="header-resizer"
            class="resizer"
            @click=${(event: MouseEvent) => event.stopPropagation()}
            @mousedown=${(event: MouseEvent) =>
              this.handleResizeMouseDown(event, column.field)}
          ></div>
        `
      : nothing;
  }

  protected renderHeaderCell(field: NestedKeyOf<T>) {
    const column = this.getDisplayColumn(field);
    if (!column) {
      return nothing;
    }

    const state = this.getOrCreateColumnState(field);
    const title = column.title ?? column.field;

    let ariaSort: 'none' | 'ascending' | 'descending' = 'none';
    if (state.sort?.order === 'asc') ariaSort = 'ascending';
    if (state.sort?.order === 'desc') ariaSort = 'descending';

    const role = state.visible ? 'columnheader' : undefined;
    const hidden = state.visible ? false : undefined;

    const classes = {
      cell: true,
      sortable: column.sortable ?? this.sortable,
    };

    return this.renderCellWrapper(html`
      <div
        role=${ifDefined(role)}
        aria-hidden=${ifDefined(hidden)}
        aria-sort=${ariaSort}
        aria-label=${title}
        part="cell header-cell"
        class=${classMap(classes)}
        draggable=${ifDefined(this.enableColumnReorder ? true : undefined)}
        data-field=${column.field}
        @dragstart=${(event: DragEvent) =>
          this.handleDragColumnStart(event, column.field)}
        @dragenter=${this.handleDragColumnEnter}
        @dragleave=${this.handleDragColumnLeave}
        @dragover=${this.handleDragColumnOver}
        @drop=${(event: DragEvent) =>
          this.handleDragColumnDrop(event, column.field)}
        @dragend=${this.handleDragColumnEnd}
        @click=${(event: MouseEvent) => this.handleHeaderClicked(event, column)}
      >
        <div class="header-content">
          <span class="header-title truncate" part="header-title">
            ${title}
          </span>
          ${this.renderColumnSortIcon(column, state)}
        </div>
        ${this.renderColumnResizer(column, state)}
        <div part="drop-indicator" class="drop-indicator"></div>
      </div>
    `);
  }

  protected renderRowNumberHeader() {
    return this.renderCellWrapper(
      html`<div part="cell-index" class="cell-index"></div>`,
    );
  }

  protected renderSelectionHeader() {
    return this.renderCellWrapper(
      html`<div part="cell-selector" class="cell-selector"></div>`,
    );
  }

  protected renderHeader() {
    const classes = {
      header: true,
      reorderable: this.enableColumnReorder,
    };
    return html`
      <div role="rowgroup" part="header" class=${classMap(classes)}>
        <div role="row" class="row header-row" part="row header-row">
          ${this.renderRowNumberHeader()} ${this.renderSelectionHeader()}
          ${this.columnOrder.map(field => this.renderHeaderCell(field))}
        </div>
      </div>
    `;
  }

  protected renderCellContents(
    value: unknown,
    column: DisplayColumnOptions<T>,
    row: T,
  ) {
    if (column.cellRenderer) {
      return column.cellRenderer(value, column.field, row);
    }

    if (value == null) {
      return this.nullValuePlaceholder;
    }

    const indices = this.rowMetadata.get(row)!.highlightIndices;

    return this.enableSearchHighlight && indices
      ? highlightText(String(value), indices[column.field])
      : value;
  }

  protected renderCell(field: NestedKeyOf<T>, row: T) {
    const column = this.getDisplayColumn(field);
    if (!column) {
      return nothing;
    }

    let value = getNestedValue(row, column.field);
    // Get the user parts from the raw value
    // before we call the value formatter.
    let userParts = column.cellParts?.call(this, value, column.field, row);
    if (Array.isArray(userParts)) {
      userParts = userParts.join(' ');
    }

    if (typeof column.valueFormatter === 'function') {
      value = column.valueFormatter(value, row);
    }

    return this.renderCellWrapper(html`
      <div
        role="cell"
        part="cell body-cell cell-${column.field} ${userParts}"
        data-field=${column.field}
        class="cell"
        title=${ifDefined(value ? String(value) : undefined)}
        @click=${(event: MouseEvent) =>
          this.handleCellClick(event, row, column.field)}
      >
        <span class="truncate">
          ${this.renderCellContents(value, column, row)}
        </span>
      </div>
    `);
  }

  protected renderRowSelectorCell(row: T, selected: boolean) {
    return this.renderCellWrapper(html`
      <div part="cell body-cell" class="cell body-cell">
        <div part="row-selector-cell" class="row-selector-cell">
          <label>
            <input
              part="row-checkbox"
              class="row-checkbox"
              type="checkbox"
              .checked=${selected}
              @change=${(event: Event) =>
                this.handleRowSelectionClicked(event, row)}
            />
          </label>
        </div>
      </div>
    `);
  }

  protected renderRowNumberCell(rowNumber: number) {
    return this.renderCellWrapper(html`
      <div part="cell body-cell" class="cell body-cell">
        <div part="row-number-cell" class="row-number-cell">${rowNumber}</div>
      </div>
    `);
  }

  protected renderRow(row: T, renderIndex: number) {
    const metadata = this.rowMetadata.get(row)!;
    const selected = this._selectedRowIds.has(metadata.id);
    let userParts = this.rowParts?.(row) ?? '';
    if (Array.isArray(userParts)) {
      userParts = userParts.join(' ');
    }

    const classes = { row: true, selected };
    const rowIndex = renderIndex + 1;

    return html`
      <div
        role="row"
        aria-rowindex=${rowIndex}
        aria-selected=${selected ? 'true' : 'false'}
        part=${'row ' + userParts}
        class=${classMap(classes)}
      >
        ${this.renderRowNumberCell(rowIndex)}
        ${this.renderRowSelectorCell(row, selected)}
        ${this.columnOrder.map(field => this.renderCell(field, row))}
      </div>
    `;
  }

  protected renderBodyContents() {
    if (!this.hasVisibleColumn()) {
      return html`
        <div part="message" class="message">No visible columns.</div>
      `;
    }

    if (this.data.length === 0) {
      return html`
        <div part="message" class="message">${this.emptyMessage}</div>
      `;
    }
    if (this.filteredData.length === 0) {
      return html`
        <div part="message" class="message">${this.noResultsMessage}</div>
      `;
    }

    if (this.enableVirtualScroll) {
      return html`
        <lit-virtualizer
          .items=${this.filteredData}
          .renderItem=${(item: T, index: number) =>
            this.renderRow(item, index) as TemplateResult}
        >
        </lit-virtualizer>
      `;
    }

    return html`
      ${repeat(
        this.filteredData,
        item => this.rowMetadata.get(item)!.id,
        (item, index) => this.renderRow(item, index),
      )}
    `;
  }

  protected renderFooter() {
    if (!this.enableFooter) {
      return nothing;
    }

    const total = this.data.length;
    const filtered = this.filteredData.length;

    const fmt = new Intl.NumberFormat(undefined);
    const totalStr = fmt.format(total);
    const filteredStr = fmt.format(filtered);

    const rowCountText =
      total !== filtered
        ? `Showing ${filteredStr} of ${totalStr} records`
        : `Total records: ${totalStr}`;

    const formatter = Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const lastUpdateText = this.dataLastUpdate
      ? formatter.format(this.dataLastUpdate)
      : 'Never';

    return html`
      <div part="footer" class="footer">
        <slot name="footer">
          <span part="row-count">${rowCountText}</span>
          <span part="timestamp">${lastUpdateText}</span>
        </slot>
      </div>
    `;
  }

  protected override render() {
    const gridTemplate = this.getGridWidths().join(' ');
    const style = {
      '--grid-template': gridTemplate,
    };

    /*
     * DO NOT USE THE DEFAULT SLOT!
     * It causes whitespace like new lines in the HTML to override the body.
     */
    return html`
      <div class="wrapper">
        <div class="scroller">
          <div
            role="table"
            aria-label="Data Table"
            aria-rowcount=${this.filteredData.length}
            part="table"
            class="table"
            style=${styleMap(style)}
          >
            ${this.renderHeader()}
            <div class="body" role="rowgroup">
              <slot name="body">${this.renderBodyContents()}</slot>
            </div>
          </div>
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }

  private renderCellWrapper(content: TemplateResult | typeof nothing) {
    return html` <div class="cell-wrapper">${content}</div> `;
  }

  // #endregion

  // #region --- Lifecycle Methods ---

  protected override updated(changedProperties: PropertyValues<YatlTable<T>>) {
    super.updated(changedProperties);

    // Dispatch all of the change notification events here.
    if (changedProperties.has('searchQuery')) {
      this.dispatchEvent(new YatlTableSearchEvent(this.searchQuery));
    }

    if (changedProperties.has('selectedRowIds')) {
      this.dispatchEvent(new YatlRowSelectEvent(this.selectedRowIds));
    }

    if (changedProperties.has('columnOrder')) {
      this.dispatchEvent(new YatlColumnReorderEvent(this.columnOrder));
    }

    if (changedProperties.has('columnStates')) {
      const oldValue = changedProperties.get('columnStates');
      for (const newState of this.columnStates) {
        const oldState = oldValue
          ? findColumn(oldValue, newState.field)
          : undefined;
        const changes = getColumnStateChanges(oldState, newState);
        if (changes.includes('sort')) {
          const event = new YatlColumnSortEvent(
            newState.field,
            newState.sort?.order ?? null,
          );
          this.dispatchEvent(event);
        }
        if (changes.includes('visible')) {
          const event = new YatlColumnToggleEvent(
            newState.field,
            newState.visible,
          );
          this.dispatchEvent(event);
        }
        if (changes.includes('width')) {
          const event = new YatlColumnResizeEvent(
            newState.field,
            newState.width,
          );
          this.dispatchEvent(event);
        }
      }
    }

    // We check if any of the properties that affect visual state were updated.
    const stateProps: (keyof YatlTable<T>)[] = [
      'columnOrder',
      'columnStates',
      'searchQuery',
      'filters',
    ];

    const changedStateProp = stateProps.filter(prop =>
      changedProperties.has(prop),
    );

    if (changedStateProp.length) {
      this.dispatchEvent(
        new YatlTableStateChangeEvent(this.getTableState(), changedStateProp),
      );
    }

    if (this.storageOptions?.key) {
      const shouldSave = Array.from(changedProperties.keys()).some(prop =>
        SAVE_TRIGGERS.has(prop as keyof YatlTable<T>),
      );

      if (shouldSave) {
        this.scheduleSave();
      }
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.addEventListener('mousemove', this.handleResizeMouseMove);
    window.addEventListener('mouseup', this.handleResizeMouseUp);
  }

  // #endregion

  // #region --- Filter Methods ---

  /**
   * Calculates a relevance score for a given query against a target string.
   *
   * This function implements a tiered matching strategy:
   * 1.  **Exact Match**: The query exactly matches the target. This yields the highest score.
   * 2.  **Prefix Match**: The target starts with the query. This is the next most relevant.
   * 3.  **Substring Match**: The target contains the query somewhere. This is the least relevant.
   *
   * The final score is weighted and adjusted by the length difference between the query and the target
   * to ensure that more specific matches (e.g., "apple" vs "application" for the query "apple") rank higher.
   *
   * @param query The search term (e.g., "app").
   * @param target The string to be searched (e.g., "Apple" or "Application").
   * @returns A numerical score representing the relevance of the match. Higher is better. Returns 0 if no match is found.
   */
  private calculateSearchScore(query: string, target: string): SearchResult {
    const results: SearchResult = { score: 0, ranges: [] };

    if (!query || !target) {
      return results;
    }

    let baseScore = 0;
    let matchTypeWeight = 0;

    if (target === query) {
      matchTypeWeight = MATCH_WEIGHTS.EXACT;
      baseScore = query.length;
      results.ranges.push([0, target.length]);
    } else if (target.startsWith(query)) {
      matchTypeWeight = MATCH_WEIGHTS.PREFIX;
      baseScore = query.length;
      results.ranges.push([0, query.length]);
    } else {
      const index = target.indexOf(query);
      if (index !== -1) {
        matchTypeWeight = MATCH_WEIGHTS.SUBSTRING;
        baseScore = query.length;

        let cursor = index;
        while (cursor !== -1) {
          results.ranges.push([cursor, cursor + query.length]);
          cursor = target.indexOf(query, cursor + 1);
        }
      } else {
        return results;
      }
    }

    // Reward matches where the query length is close to the target length.
    const lengthDifference = target.length - query.length;
    const specificityBonus = 1 / (1 + lengthDifference);

    // The final score is a combination of the match type's importance,
    // the base score from the query length, and the specificity bonus.
    results.score = baseScore * matchTypeWeight * specificityBonus;
    return results;
  }

  private searchField(
    query: QueryToken,
    value: string,
    tokens?: string[],
  ): SearchResult {
    const result: SearchResult = { score: 0, ranges: [] };

    const addRangesFromValue = (searchTerm: string) => {
      let idx = value.indexOf(searchTerm);
      while (idx !== -1) {
        result.ranges.push([idx, idx + searchTerm.length]);
        idx = value.indexOf(searchTerm, idx + 1);
      }
    };

    // Handle Quoted/Untokenized (Direct Search)
    if (query.quoted || !tokens) {
      if (!this.enableSearchScoring) {
        // Simple boolean match
        if (value.includes(query.value)) {
          result.score = 1;
          addRangesFromValue(query.value);
        }
      } else {
        // Scored match
        const calculation = this.calculateSearchScore(query.value, value);
        result.score = calculation.score;
        result.ranges = calculation.ranges;
      }
      return result;
    }

    // Handle Tokenized Search
    // We search the tokens to check for validity/scoring,
    // but we map back to the 'value' for highlighting.
    if (!this.enableSearchScoring) {
      const isMatch = tokens.some(token => token.includes(query.value));
      if (isMatch) {
        result.score = 1;
        addRangesFromValue(query.value);
      }
      return result;
    }

    // Complex Scored Token Search
    // We sum the scores of all matching tokens
    for (const token of tokens) {
      const calculation = this.calculateSearchScore(query.value, token);
      if (calculation.score > 0) {
        result.score += calculation.score;
        // If a token matched, find that query in the main string
        addRangesFromValue(query.value);
      }
    }

    return result;
  }

  private filterField(
    value: unknown,
    filter: unknown,
    filterFunction: ColumnFilterCallback | null = null,
  ): boolean {
    if (Array.isArray(filter)) {
      if (filter.length === 0) {
        return true;
      }
      // If it's an array, we will use an OR filter.
      // If any filters in the array match, keep it.
      return filter.some(element =>
        this.filterField(value, element, filterFunction),
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return false;
      }
      return value.some(element =>
        this.filterField(element, filter, filterFunction),
      );
    }

    if (typeof filterFunction === 'function') {
      return filterFunction(value, filter);
    }

    if (filter instanceof RegExp) {
      return filter.test(String(value));
    }

    return filter === value;
  }

  private filterRow(row: T, index: number): boolean {
    if (!this.filters) {
      return true;
    }

    if (typeof this.filters === 'function') {
      return this.filters(row, index);
    }

    for (const field in this.filters) {
      const filter = getNestedValue(this.filters, field);
      const value = getNestedValue(row, field);
      if (typeof filter === 'function') {
        if (!filter(value)) {
          return false;
        }
      } else {
        const column = this.getColumn(field as NestedKeyOf<T>);
        const filterCallback = column ? column.filter : undefined;
        if (!this.filterField(value, filter, filterCallback)) {
          return false;
        }
      }
    }
    return true;
  }

  private filterRows() {
    const columnData = [...this.columns];
    const fields = columnData
      .filter(column => column.searchable)
      .map(column => column.field);

    this._filteredData = this.data.filter((row, index) => {
      const metadata = this.rowMetadata.get(row)!;
      metadata.searchScore = 0;
      metadata.highlightIndices = {};
      // Filter takes precedence over search.
      if (!this.filterRow(row, index)) {
        return false;
      }

      if (!this.queryTokens) {
        return true;
      }

      for (const field of fields) {
        const originalValue = getNestedValue(row, field);
        const compareValue = metadata.searchValues[field];
        const columnTokens = metadata.searchTokens[field];

        if (
          typeof originalValue !== 'string' ||
          typeof compareValue !== 'string'
        ) {
          continue;
        }

        const fieldResults: SearchResult = { score: 0, ranges: [] };
        for (const token of this.queryTokens) {
          const results = this.searchField(token, compareValue, columnTokens);
          fieldResults.score += results.score;
          fieldResults.ranges.push(...results.ranges);
        }

        if (fieldResults.score > 0) {
          metadata.searchScore += fieldResults.score;
          metadata.highlightIndices[field] = fieldResults.ranges;
        }
      }

      return metadata.searchScore > 0;
    });

    this.filterDirty = false;

    this.sortRows();
    this.dispatchEvent(new YatlTableViewChangeEvent(this.data));
  }

  // #endregion

  // #region --- Sort Methods ---

  private compareRows(a: T, b: T, field: NestedKeyOf<T>): number {
    let aValue, bValue;

    const state = this.getOrCreateColumnState(field);
    if (!state.sort) {
      return 0;
    }

    const aMetadata = this.rowMetadata.get(a)!;
    const bMetadata = this.rowMetadata.get(b)!;

    if (state.sort?.order === 'asc') {
      aValue = aMetadata.sortValues[field];
      bValue = bMetadata.sortValues[field];
    } else {
      aValue = bMetadata.sortValues[field];
      bValue = aMetadata.sortValues[field];
    }

    aValue ??= Number.MIN_SAFE_INTEGER;
    bValue ??= Number.MIN_SAFE_INTEGER;

    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  }

  private sortRows() {
    if (this.filterDirty) {
      this.filterRows();
      return;
    }

    const sortedStates = [...this._columnStateMap.values()]
      // Filter to visible columns with active sort states
      .filter(state => state.visible && state.sort)
      // Sort our columns by their sort priority.
      // This is how sorting by multiple columns is handled.
      .sort((a, b) => b.sort!.priority - a.sort!.priority);

    this._filteredData = this._filteredData.toSorted((a, b) => {
      const aMetadata = this.rowMetadata.get(a)!;
      const bMetadata = this.rowMetadata.get(b)!;

      // Try to sort by search score if we're using scoring and there is a query.
      if (this.enableSearchScoring && this.queryTokens) {
        const aValue = aMetadata.searchScore || 0;
        const bValue = bMetadata.searchScore || 0;
        if (aValue > bValue) return -1;
        if (aValue < bValue) return 1;
      }

      for (const state of sortedStates) {
        const comp = this.compareRows(a, b, state.field);
        if (comp !== 0) {
          return comp;
        }
      }

      // Always fall back to the index column
      return aMetadata.index - bMetadata.index;
    });
    this.sortDirty = false;
  }

  // #endregion

  // #region --- Utilities ---

  private createMetadata() {
    this.idToRowMap = new Map();
    this.rowMetadata = new WeakMap();

    const rankMaps = new Map<string, Map<unknown, number>>();
    // TODO: We only need rank maps for sortable columns
    // but the user could enable sorting later. It's easiest
    // to just compute them all know regardless.
    for (const column of this.columns) {
      // Collect all raw values for this column
      const rawValues = this.data.map(row => {
        const originalValue = getNestedValue(row, column.field);
        const modifiedValue = column.sorter?.(originalValue) ?? originalValue;
        return [originalValue, modifiedValue] as [unknown, unknown];
      });
      rankMaps.set(column.field, createRankMap(rawValues));
    }

    let index = 0;
    for (const row of this.data) {
      let rowId = this._rowIdCallback(row, index);
      // If the user screws
      if (rowId == null || this.idToRowMap.has(rowId)) {
        warnInvalidIdFunction(index, rowId, row);
        rowId = `__yatl_fallback_id_${index}`;
      }

      this.idToRowMap.set(rowId, row);
      // Add the index
      const metadata: RowMetadata = {
        id: rowId,
        index: index++,
        searchTokens: {},
        searchValues: {},
        sortValues: {},
        selected: false,
      };
      this.rowMetadata.set(row, metadata);

      for (const column of this.columns) {
        const value = getNestedValue(row, column.field);
        const rankMap = rankMaps.get(column.field)!;
        metadata.sortValues[column.field] = rankMap.get(value) ?? null;

        // Cache precomputed lower-case values for search
        if (typeof value === 'string') {
          metadata.searchValues[column.field] = value.toLocaleLowerCase();
        }

        // Tokenize any searchable columns
        if (column.searchable && column.tokenize && value) {
          const tokenizer = column.searchTokenizer ?? this.searchTokenizer;
          metadata.searchTokens[column.field] = tokenizer(String(value)).map(
            token => token.value,
          );
        }
      }
    }
  }

  private updateInternalQuery() {
    if (this.searchQuery.length === 0) {
      this.queryTokens = null;
      return;
    }

    this.queryTokens = [
      { value: this.searchQuery.toLocaleLowerCase(), quoted: true },
    ];

    if (this.enableSearchTokenization) {
      this.queryTokens.push(...this.searchTokenizer(this.searchQuery));
    }
  }

  private hasVisibleColumn() {
    return (
      this.columnOrder
        .map(field => this.getOrCreateColumnState(field))
        .filter(state => state.visible).length > 0
    );
  }

  /**
   * Gets the width of each column in the
   * order they will appear in the grid.
   */
  private getGridWidths() {
    const widths: string[] = [];

    if (this.enableRowNumberColumn) {
      widths.push('var(--yatl-row-number-column-width, 48px)');
    } else {
      widths.push('0');
    }

    if (this.rowSelectionMethod) {
      widths.push('var(--yatl-row-selector-column-width, 48px)');
    } else {
      widths.push('0');
    }

    for (const field of this.columnOrder) {
      const state = this.getOrCreateColumnState(field);

      // Check if we have a fixed pixel width (User resized it)
      const hasPixelWidth = state.width != null;

      if (state.visible) {
        if (hasPixelWidth) {
          widths.push(`${state.width}px`);
        } else {
          widths.push('minmax(0, 1fr)');
        }
      } else {
        if (hasPixelWidth) {
          widths.push('0px');
        } else {
          widths.push('minmax(0, 0fr)');
        }
      }
    }

    return widths;
  }

  private scheduleSave() {
    window.clearTimeout(this.saveTimer);

    this.saveTimer = window.setTimeout(() => {
      this.saveStateToStorage();
    }, STATE_SAVE_DEBOUNCE);
  }

  /**
   * Gets the column state associated with the given field.
   * If the state doesn't exist, a default state will be created.
   */
  private getOrCreateColumnState(field: NestedKeyOf<T>) {
    if (!this._columnStateMap.has(field)) {
      const column = this.getDisplayColumn(field);
      const state = createState(field, { title: column?.title });
      this._columnStateMap.set(field, state);
    }

    return this._columnStateMap.get(field)!;
  }

  private getRowId(row: T) {
    const metadata = this.rowMetadata.get(row);
    if (!metadata) {
      throw new Error('The provided row does not exist in the current dataset');
    }
    return metadata.id;
  }

  // #endregion

  // #region --- Storage Methods  ---

  private saveStateToStorage() {
    if (!this.storageOptions) {
      return;
    }

    const options = { ...DEFAULT_STORAGE_OPTIONS, ...this.storageOptions };
    const savedTableState: RestorableTableState<T> = {
      columns: [],
    };
    const tableState = this.getTableState();

    if (options.saveSearchQuery) {
      savedTableState.searchQuery = tableState.searchQuery;
    }

    if (options.saveColumnOrder) {
      savedTableState.columnOrder = tableState.columnOrder;
    }

    for (const columnState of tableState.columns) {
      const savedColumnState: RestorableColumnState<T> = {
        field: columnState.field,
      };

      if (options.saveColumnSortOrders) {
        savedColumnState.sort = columnState.sort;
      }

      if (options.saveColumnVisibility) {
        savedColumnState.visible = columnState.visible;
      }

      if (options.saveColumnWidths) {
        savedColumnState.width = columnState.width;
      }

      savedTableState.columns?.push(savedColumnState);
    }

    const storage =
      options.storage === 'session' ? sessionStorage : localStorage;
    try {
      storage.setItem(options.key, JSON.stringify(savedTableState));
    } catch (error) {
      console.warn('Failed to save table state', error);
    }
  }

  private loadStateFromStorage() {
    if (!this.storageOptions) {
      return;
    }

    const options = { ...DEFAULT_STORAGE_OPTIONS, ...this.storageOptions };
    const json = localStorage.getItem(options.key);
    if (!json) {
      return;
    }

    try {
      const savedTableState = JSON.parse(json) as RestorableTableState<T>;
      const tableStateToRestore: RestorableTableState<T> = {};

      if (options.saveSearchQuery) {
        tableStateToRestore.searchQuery = savedTableState.searchQuery;
      }

      if (options.saveColumnOrder) {
        tableStateToRestore.columnOrder = savedTableState.columnOrder;
      }

      if (savedTableState.columns) {
        tableStateToRestore.columns = [];
        for (const savedColumnState of savedTableState.columns) {
          const columnStateToRestore: RestorableColumnState<T> = {
            field: savedColumnState.field,
          };

          if (options.saveColumnVisibility) {
            columnStateToRestore.visible = savedColumnState.visible;
          }

          if (options.saveColumnWidths) {
            columnStateToRestore.width = savedColumnState.width;
          }

          if (options.saveColumnSortOrders) {
            columnStateToRestore.sort = savedColumnState.sort;
          }
          tableStateToRestore.columns.push(columnStateToRestore);
        }
      }

      this.updateTableState(tableStateToRestore);
      this.hasRestoredState = true;
    } catch (error) {
      console.error('Failed to restore DataTable state:', error);
    }
  }

  // #endregion

  // #region --- Event Handlers ---

  private handleHeaderClicked = (
    event: MouseEvent,
    column: ColumnOptions<T>,
  ) => {
    const cell = event.currentTarget as HTMLElement;
    // Ignore header click events while resizing
    if (!cell.classList.contains('sortable') || this.resizeState) {
      return;
    }

    const multiSort = event.shiftKey;
    const state = this.getOrCreateColumnState(column.field);

    if (!state?.sort) {
      this.sort(column.field, 'asc', !multiSort);
    } else if (state.sort.order === 'asc') {
      this.sort(column.field, 'desc', !multiSort);
    } else if (state.sort.order) {
      this.sort(column.field, null, !multiSort);
    }
  };

  private handleCellClick = (
    event: MouseEvent,
    row: T,
    field: NestedKeyOf<T>,
  ) => {
    // Ignore events if the user is highlighting text
    if (window.getSelection()?.toString()) return;

    const metadata = this.rowMetadata.get(row)!;
    this.dispatchEvent(
      new YatlRowClickEvent(row, metadata.id, metadata.index, field, event),
    );
  };

  private handleResizeMouseDown(event: MouseEvent, field: NestedKeyOf<T>) {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const header = target.closest('.cell');
    if (!header) {
      return;
    }

    let columnIndex = this.columnOrder.findIndex(col => col === field);
    if (columnIndex < 0) {
      return;
    }

    if (this.enableRowNumberColumn) {
      columnIndex++;
    }
    if (this.rowSelectionMethod) {
      columnIndex++;
    }

    this.tableElement.classList.add('resizing');

    // Freeze the current widths as soon as the users starts resizing
    this.tableElement
      .querySelectorAll<HTMLElement>('.header .cell')
      .forEach(element => {
        const field = element.dataset.field as NestedKeyOf<T> | undefined;
        if (field) {
          const state = this.getColumnState(field);
          if (state) {
            state.width = element.getBoundingClientRect().width;
          }
          this._columnStateMap.set(field, state);
        }
      });

    const gridWidths = this.getGridWidths();
    this.resizeState = {
      active: true,
      startX: event.pageX,
      startWidth: header.getBoundingClientRect().width,
      columnIndex: columnIndex,
      columnField: field,
      currentWidths: gridWidths,
    };

    this.tableElement.style.setProperty(
      '--grid-template',
      gridWidths.join(' '),
    );

    window.addEventListener('mousemove', this.handleResizeMouseMove);
    window.addEventListener('mouseup', this.handleResizeMouseUp);
  }

  private handleResizeMouseMove = (event: MouseEvent) => {
    if (!this.resizeState?.active) return;

    requestAnimationFrame(() => {
      if (!this.resizeState?.active) return;

      const deltaX = event.pageX - this.resizeState.startX;
      const newWidth = Math.max(50, this.resizeState.startWidth + deltaX);
      this.resizeState.currentWidths[this.resizeState.columnIndex] =
        `${newWidth}px`;
      this.tableElement.style.setProperty(
        '--grid-template',
        this.resizeState.currentWidths.join(' '),
      );
    });
  };

  private handleResizeMouseUp = (event: MouseEvent) => {
    window.removeEventListener('mousemove', this.handleResizeMouseMove);
    window.removeEventListener('mouseup', this.handleResizeMouseUp);

    this.tableElement.classList.remove('resizing');

    if (this.resizeState?.active) {
      event.preventDefault();
      event.stopPropagation();

      // Calculate the final width based on the DOM's current style
      const finalWidth = parseFloat(
        this.resizeState.currentWidths[this.resizeState.columnIndex],
      );
      const columnState = this.getColumnState(this.resizeState.columnField);
      columnState.width = finalWidth;
      this.columnStates = [columnState];
    }

    // This is a hacky workaround to prevent the header click event from firing
    // if the user releases their mouse click outside of the resizer handle.
    setTimeout(() => {
      this.resizeState = null;
    });
  };

  private handleDragColumnStart = (event: DragEvent, field: NestedKeyOf<T>) => {
    const target = event.target as HTMLElement;

    if (target?.classList.contains('resizer')) {
      event.preventDefault();
      return;
    }

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', field);
      this.dragColumn = field;
    }
  };

  private handleDragColumnEnter = (event: DragEvent) => {
    const cell = event.currentTarget as HTMLElement;
    cell.querySelector('.drop-indicator')?.classList.add('active');
  };

  private handleDragColumnLeave = (event: DragEvent) => {
    const cell = event.currentTarget as HTMLElement;
    const enteringElement = event.relatedTarget as Node;

    if (cell.contains(enteringElement)) {
      return;
    }

    cell.querySelector('.drop-indicator')?.classList.remove('active');
  };

  private handleDragColumnOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  private handleDragColumnDrop = (event: DragEvent, field: NestedKeyOf<T>) => {
    if (!this.dragColumn || this.dragColumn === field) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.moveColumn(this.dragColumn, field);
  };

  private handleDragColumnEnd = () => {
    this.dragColumn = null;
    // Clean up just in case
    this.tableElement
      .querySelectorAll('.drop-indicator.active')
      .forEach(element => element.classList.remove('active'));
  };

  private handleRowSelectionClicked = (event: Event, row: T) => {
    event.stopPropagation();
    const inputElement = event.currentTarget as HTMLInputElement;
    const selected = inputElement.checked;
    this.toggleRowSelection(row, selected);
  };

  // #endregion
}

interface RowMetadata {
  id: RowId;
  index: number;
  searchScore?: number;
  /** Precomputed search tokens */
  searchTokens: Record<string, string[]>;
  /** Precomputed search values */
  searchValues: Record<string, string>;
  /** Precomputed sort values */
  sortValues: Record<string, number | null>;
  highlightIndices?: Record<string, [number, number][]>;
  selected: boolean;
}

interface SearchResult {
  score: number;
  ranges: [number, number][]; // Array of [start, end] tuples
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-table': YatlTable;
  }
}

let _hasWarnedMissingId = false;
function warnMissingId() {
  if (_hasWarnedMissingId) return;
  _hasWarnedMissingId = true;

  console.warn(
    `[yatl-table] Data rows are missing a unique 'id' or 'key' property.
     Falling back to array index.
     Selection and sorting may behave unexpectedly.
     Please provide a unique ID via the 'rowIdCallback' property.
    `,
  );
}

let _hasWarnedInvalidIdFunction = false;
function warnInvalidIdFunction<T>(index: number, rowId: RowId, row: T) {
  if (_hasWarnedInvalidIdFunction) return;
  _hasWarnedInvalidIdFunction = true;
  console.warn(
    `[yatl-table] rowIdCallback returned non-unique id (${rowId}) for data at index ${index}.
    Falling back to array index.
    Selection and sorting may behave unexpectedly.
  `,
  );
  console.debug(row);
}

export {
  createRegexTokenizer,
  findColumn,
  isDisplayColumn,
  isInternalColumn,
  whitespaceTokenizer,
};
