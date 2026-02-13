import type {
  ColumnFilterCallback,
  ColumnOptions,
  ColumnState,
  ExportOptions,
  FilterCallback,
  Filters,
  NestedKeyOf,
  QueryToken,
  RestorableColumnState,
  RestorableTableState,
  RowId,
  RowIdCallback,
  RowSelectionMethod,
  SortOrder,
  StorageOptions,
  TableControllerOptions,
  TableState,
  TokenizerCallback,
  UnspecifiedRecord,
} from '../types';

import {
  createState,
  getNestedValue,
  isDisplayColumn,
  isRowIdType,
  isRowSelectionMethod,
  whitespaceTokenizer,
  getColumnStateChanges,
} from '../utils';

import { createRankMap } from './utils';

import { ReactiveController, ReactiveControllerHost } from 'lit';

import {
  YatlColumnReorderEvent,
  YatlColumnResizeEvent,
  YatlColumnSortEvent,
  YatlColumnToggleEvent,
  YatlRowSelectEvent,
  YatlTableSearchEvent,
  YatlTableStateChangeEvent,
  YatlTableViewChangeEvent,
} from '../events';
import { TypedEventTarget } from '../utils/typed-event-target';

// #region Constants

// Debounce between state saves
const STATE_SAVE_DEBOUNCE = 1000;

const DEFAULT_STORAGE_OPTIONS: Partial<StorageOptions> = {
  storage: 'local',
  saveColumnSortOrders: true,
  saveColumnVisibility: true,
  saveColumnWidths: true,
  saveColumnOrder: true,
  saveSelectedRows: true,
};

const MATCH_WEIGHTS = {
  EXACT: 100,
  PREFIX: 50,
  SUBSTRING: 10,
};

// #endregion

export class YatlTableController<T extends object = UnspecifiedRecord>
  extends TypedEventTarget<ControllerEventMap>
  implements ReactiveController
{
  // #region State Data

  // Property data
  private hosts = new Set<ReactiveControllerHost>();
  private _enableSearchTokenization = false;
  private _enableSearchScoring = false;
  // Original options passed by the user
  private _columns: ColumnOptions<T>[] = [];
  // Options mapped by field for faster lookup
  private _columnDefinitionMap = new Map<NestedKeyOf<T>, ColumnOptions<T>>();
  private _columnStateMap = new Map<NestedKeyOf<T>, Readonly<ColumnState<T>>>();
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
  private _filteredData: T[] = [];
  // The last time the data was updated.
  // This is just provided as a convience so the
  // table element can display it in the footer.
  // The controller needs to own it so it is always accurate.
  private _dataUpdateTimestamp: Date | null = null;

  private _searchQuery = '';
  private _searchTokenizer: TokenizerCallback = whitespaceTokenizer;
  private _filters: Filters<T> | FilterCallback<T> | null = null;

  // Flag if we have already restored the state or not.
  private hasRestoredState = false;

  // save state debounce timer
  private saveTimer = 0;

  // Flags set when something changes that
  // requires the filter or sort logic to re-run.
  private filterDirty = false;
  private sortDirty = false;

  // Maps rows to their metadata
  private rowMetadata = new WeakMap<T, RowMetadata>();
  // Map row ids to their rows for faster lookup
  private idToRowMap = new Map<RowId, T>();
  // List of tokens created from the current query
  private queryTokens: QueryToken[] | null = null;

  // #endregion

  // #region Properties

  /**
   * Enables tokenized search behavior.
   * When enabled, the search query is split into individual tokens using the
   * `searchTokenizer` function (defaults to splitting on whitespace).
   * A row is considered a match if **ANY** of the tokens appear in the searchable fields.
   * @default false
   */
  public get enableSearchTokenization() {
    return this._enableSearchTokenization;
  }

  public set enableSearchTokenization(enable) {
    if (this._enableSearchTokenization === enable) {
      return;
    }

    this._enableSearchTokenization = enable;
    this.updateInternalQuery();
    this.filterDirty = true;
    this.requestUpdate('enableSearchTokenization');
  }

  /**
   * Enables weighted relevance scoring for search results.
   * When enabled, exact matches and prefix matches are ranked higher than substring matches.
   * Rows are sorted by their relevance score descending.
   * @default false
   */
  public get enableSearchScoring() {
    return this._enableSearchScoring;
  }

  public set enableSearchScoring(enable) {
    if (this._enableSearchScoring === enable) {
      return;
    }

    this._enableSearchScoring = enable;
    this.filterDirty = true;
    this.requestUpdate('enableSearchScoring');
  }

  /**
   * The definitions for the columns to be rendered.
   * This defines the field mapping, titles, sortability, and other static options.
   */
  public get columns() {
    return [...this._columns];
  }

  public set columns(columns) {
    this._columns = [...columns];
    this.filterDirty = true;
    // Cache these in a map for faster lookups
    this._columnDefinitionMap = new Map();
    for (const column of columns) {
      this._columnDefinitionMap.set(column.field, column);
    }
    this.requestUpdate('columns');
  }

  public get displayColumns() {
    return this.columns.filter(isDisplayColumn);
  }

  public get columnStates() {
    return this.columns.map(column => {
      const state = this.getColumnState(column.field);
      // Always return a copy so the user can't modify it.
      return createState(column.field, state);
    });
  }

  public set columnStates(states) {
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

    this.requestUpdate('columnStates');
  }

  /**
   * The current text string used to filter the table data.
   * Setting this property triggers a new search and render cycle.
   */
  public get searchQuery() {
    return this._searchQuery;
  }

  public set searchQuery(query) {
    if (this._searchQuery === query) {
      return;
    }

    this._searchQuery = query;
    this.updateInternalQuery();
    this.filterDirty = true;
    this.requestUpdate('searchQuery');
  }

  /**
   * A function that splits the search query into tokens.
   * Only used if `enableSearchTokenization` is true.
   * @default whitespaceTokenizer
   */
  public get searchTokenizer() {
    return this._searchTokenizer;
  }

  public set searchTokenizer(tokenizer) {
    if (this._searchTokenizer === tokenizer) {
      return;
    }

    this._searchTokenizer = tokenizer;
    this.filterDirty = true;
    this.requestUpdate('searchTokenizer');
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
  public get filters() {
    return this._filters;
  }

  public set filters(filters) {
    if (this._filters === filters) {
      return;
    }

    this._filters = filters;
    this.filterDirty = true;
    this.requestUpdate('filters');
  }

  /**
   * The row selection method to use.
   * * single - Only a single row can be selected at a time
   * * multi - Multiple rows can be selected at a time
   * * null - Disable row selection
   */
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

    this._rowSelectionMethod = selection;
    this.requestUpdate('rowSelectionMethod');
  }

  /**
   * List of currently selected row indexes.
   * * **NOTE**: These indexes are based off the of
   * the original data array index, *not* the filtered data.
   */
  public get selectedRowIds() {
    let selectedRows = [...this._selectedRowIds];

    if (this.rowSelectionMethod === 'single') {
      selectedRows = selectedRows.slice(0, 1);
    } else if (!this.rowSelectionMethod) {
      selectedRows = [];
    }
    return selectedRows;
  }

  public set selectedRowIds(rows) {
    if (
      rows.length === this._selectedRowIds.size &&
      rows.every(a => this._selectedRowIds.has(a))
    ) {
      return;
    }

    this._selectedRowIds = new Set(rows);
    this.requestUpdate('selectedRowIds');
  }

  /**
   * Configuration options for automatically saving and restoring table state
   * (column width, order, visibility, etc.) to browser storage.
   */
  public get storageOptions() {
    return this._storageOptions ? { ...this._storageOptions } : null;
  }

  public set storageOptions(options) {
    if (this._storageOptions === options) {
      return;
    }

    this._storageOptions = options ? { ...options } : null;
    if (!this.hasRestoredState) {
      this.loadStateFromStorage();
      this.requestUpdate('storageOptions');
    }
  }

  public get rowIdCallback() {
    return this._rowIdCallback;
  }

  public set rowIdCallback(callback) {
    if (this._rowIdCallback === callback) {
      return;
    }

    this._rowIdCallback = callback;
    // Update IDs in metadata for existing data.
    for (let i = 0; i < this.data.length; ++i) {
      const row = this.data[i];
      this.rowMetadata.get(row)!.id = this._rowIdCallback(row, i);
    }
    this.requestUpdate('rowIdCallback');
  }

  /**
   * The array of data objects to be displayed.
   * Objects must satisfy the `WeakKey` constraint (objects only, no primitives).
   */
  public get data() {
    return [...this._data];
  }

  public set data(data: T[]) {
    this._data = [...data];
    this.createMetadata();
    this._dataUpdateTimestamp = new Date();
    this.filterDirty = true;
    this.requestUpdate('data');
  }

  public get filteredData() {
    if (this.filterDirty) {
      this.filterRows();
    } else if (this.sortDirty) {
      this.sortRows();
    }

    this.filterDirty = false;
    this.sortDirty = false;

    return [...this._filteredData];
  }

  public get dataUpdateTimestamp() {
    return this._dataUpdateTimestamp;
  }

  // #endregion

  // #region Public Methods

  constructor(
    host?: ReactiveControllerHost,
    options?: TableControllerOptions<T>,
  ) {
    super();

    if (host) {
      this.attach(host);
    }

    if (options) {
      if (options.enableSearchScoring !== undefined)
        this.enableSearchScoring = options.enableSearchScoring;
      if (options.enableSearchTokenization !== undefined)
        this.enableSearchTokenization = options.enableSearchTokenization;
      if (options.searchTokenizer !== undefined)
        this.searchTokenizer = options.searchTokenizer;
      if (options.rowIdCallback !== undefined)
        this.rowIdCallback = options.rowIdCallback;
      if (options.rowSelectionMethod !== undefined)
        this.rowSelectionMethod = options.rowSelectionMethod;
      if (options.storageOptions !== undefined)
        this.storageOptions = options.storageOptions;
      if (options.columns !== undefined) this.columns = options.columns;
      if (options.data !== undefined) this.data = options.data;
    }
  }

  public attach(host: ReactiveControllerHost) {
    this.hosts.add(host);
    host.addController(this);
    host.requestUpdate();
  }

  public detach(host: ReactiveControllerHost) {
    host.removeController(this);
    this.hosts.delete(host);
  }

  public getColumn(field: NestedKeyOf<T>) {
    return this._columnDefinitionMap.get(field);
  }

  public getDisplayColumn(field: NestedKeyOf<T>) {
    const column = this._columnDefinitionMap.get(field);
    if (isDisplayColumn(column)) {
      return column;
    }
  }

  /**
   * Gets a copy of the current state of the table.
   */
  public getTableState(): TableState<T> {
    return {
      searchQuery: this.searchQuery,
      selectedRows: this.selectedRowIds,
      columns: this.columnStates.map(column => {
        const state = this.getColumnState(column.field);
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

    if ('selectedRows' in state && state.selectedRows) {
      this.selectedRowIds = state.selectedRows;
    }

    if ('columns' in state && state.columns !== undefined) {
      for (const newState of state.columns) {
        this.updateColumnState(newState.field, newState);
      }
    }

    this.requestUpdate();
  }

  public getColumnState(field: NestedKeyOf<T>) {
    const currentState = this._columnStateMap.get(field);
    if (!currentState) {
      const createdState = createState(field);
      this._columnStateMap.set(field, createdState);
      return createdState;
    }
    return createState(field, currentState);
  }

  public updateColumnState(
    field: NestedKeyOf<T>,
    state: RestorableColumnState<T>,
  ) {
    const currentState = this._columnStateMap.get(field);
    const newState = createState(field, { ...currentState, ...state });
    this.columnStates = [newState];
  }

  public search(query: string) {
    this.searchQuery = query;
    this.dispatchEvent(new YatlTableSearchEvent(query));
  }

  public getColumnFilterValues(field: NestedKeyOf<T>, includeNull = false) {
    const column = this.getDisplayColumn(field);
    const values = new Map<unknown, number>();
    for (const row of this.filteredData) {
      let value = getNestedValue(row, field);
      if (column?.valueFormatter) {
        value = column.valueFormatter(value, row);
      }
      if (value != null || includeNull) {
        const valueCount = values.get(value) ?? 0;
        values.set(value, valueCount + 1);
      }
    }
    return values;
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
      for (const otherColumn of this.columns) {
        if (otherColumn.field !== field) {
          const otherState = this.getColumnState(otherColumn.field);
          otherState.sort = null;
          newStates.push(otherState);
        }
      }
    }

    this.columnStates = newStates;

    const event = new YatlColumnSortEvent(field, order, !clear);
    this.dispatchEvent(event);
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

    state.visible = newVisibility;
    this.columnStates = [state];

    const event = new YatlColumnToggleEvent(field, newVisibility);
    this.dispatchEvent(event);
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
    const newColumns = this.displayColumns;
    const originalIndex = newColumns.findIndex(col => col.field === field);
    const newIndex =
      typeof newPosition === 'number'
        ? newPosition
        : newColumns.findIndex(col => col.field === newPosition);

    if (originalIndex > -1 && newIndex > -1) {
      const [movedColumn] = newColumns.splice(originalIndex, 1);
      newColumns.splice(newIndex, 0, movedColumn);
      this.columns = newColumns;
      const event = new YatlColumnReorderEvent(newColumns.map(c => c.field));
      this.dispatchEvent(event);
    }
  }

  public resizeColumn(field: NestedKeyOf<T>, width: number | null) {
    const state = this.getColumnState(field);
    state.width = width;
    this.updateColumnState(field, state);
    this.dispatchEvent(new YatlColumnResizeEvent(field, width));
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

    const previousSelection = this.selectedRowIds;
    this.selectedRowIds = newSelection;

    const event = new YatlRowSelectEvent(newSelection, previousSelection);
    this.dispatchEvent(event);
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
    this.selectedRowIds = allIds;
  }

  /**
   * Clears all selection.
   */
  public deselectAll() {
    this.selectedRowIds = [];
  }

  /**
   * Export the current visible table data to a CSV file.
   * @param options - Options for configuring what should be exported.
   */
  public export(
    options: ExportOptions = {
      includeAllRows: false,
      includeHiddenColumns: false,
      includeInternalColumns: false,
    },
  ) {
    const data = options.includeAllRows ? this.data : this.filteredData;

    const columnData = options.includeInternalColumns
      ? this.columns
      : this.displayColumns;

    const csvHeaders = columnData
      .filter(column => {
        if (options.includeHiddenColumns) {
          return true;
        }
        return this.getColumnState(column.field).visible;
      })
      .map(column => {
        if (isDisplayColumn(column)) {
          return column.title;
        }
        return column.field;
      })
      .join(',');

    const csvRows = data
      .map(row => {
        const list: string[] = [];
        for (const column of columnData) {
          const state = this.getColumnState(column.field);
          let value = getNestedValue(row, column.field);
          if (options.includeHiddenColumns || state.visible) {
            if (
              isDisplayColumn(column) &&
              typeof column.valueFormatter === 'function'
            ) {
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
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8,' });
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
   * @param rowIds - The IDs rows to delete
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
   * @param indexes - The original indexes of rows to delete.
   */
  public deleteRowAtIndex(...indexes: number[]) {
    const newSelectedRows = new Set(this.selectedRowIds);
    for (const index of indexes) {
      const row = this.data[index];
      if (row) {
        const metadata = this.rowMetadata.get(row)!;
        this.idToRowMap.delete(metadata.id);
        this.rowMetadata.delete(row);
        newSelectedRows.delete(metadata.id);
        this.data = this.data.toSpliced(index, 1);
      }
    }
    this.selectedRowIds = [...newSelectedRows];
  }

  public getRowId(row: T) {
    const metadata = this.rowMetadata.get(row);
    if (!metadata) {
      throw new Error('The provided row does not exist in the current dataset');
    }
    return metadata.id;
  }

  public getRowIndex(row: T) {
    const metadata = this.rowMetadata.get(row);
    if (!metadata) {
      throw new Error('The provided row does not exist in the current dataset');
    }
    return metadata.index;
  }

  public getRowHighlightIndicies(row: T) {
    const metadata = this.rowMetadata.get(row);
    if (!metadata) {
      throw new Error('The provided row does not exist in the current dataset');
    }
    return metadata.highlightIndices;
  }

  // #endregion

  // #region Lifecycle Methods
  public hostConnected(): void {}

  public hostDisconnected(): void {}

  public hostUpdate(): void {}

  public hostUpdated(): void {}

  public requestUpdate(...props: (keyof YatlTableController)[]) {
    const SAVE_TRIGGERS: (keyof YatlTableController)[] = [
      'columns',
      'columnStates',
      'searchQuery',
      'selectedRowIds',
    ];
    const triggers = props.filter(p => SAVE_TRIGGERS.includes(p));
    if (triggers.length) {
      this.scheduleSave();
      this.dispatchEvent(
        new YatlTableStateChangeEvent(this.getTableState(), triggers),
      );
    }

    for (const host of this.hosts) {
      host.requestUpdate();
    }
  }

  // #endregion

  // #region Filter Methods

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
      } else if (filter !== undefined) {
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

  // #region Sort Methods

  private compareRows(a: T, b: T, field: NestedKeyOf<T>): number {
    let aValue, bValue;

    const state = this.getColumnState(field);
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

  // #region Utilities

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

  private scheduleSave() {
    window.clearTimeout(this.saveTimer);

    this.saveTimer = window.setTimeout(() => {
      this.saveStateToStorage();
    }, STATE_SAVE_DEBOUNCE);
  }

  // #endregion

  // #region Storage Methods

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

    if (options.saveSelectedRows) {
      savedTableState.selectedRows = tableState.selectedRows;
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

      if (options.saveSelectedRows) {
        tableStateToRestore.selectedRows = savedTableState.selectedRows;
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
}

export type ControllerEventMap = {
  [YatlColumnReorderEvent.EVENT_NAME]: YatlColumnReorderEvent;
  [YatlColumnResizeEvent.EVENT_NAME]: YatlColumnResizeEvent;
  [YatlColumnSortEvent.EVENT_NAME]: YatlColumnSortEvent;
  [YatlColumnToggleEvent.EVENT_NAME]: YatlColumnToggleEvent;
  [YatlRowSelectEvent.EVENT_NAME]: YatlRowSelectEvent;
  [YatlTableSearchEvent.EVENT_NAME]: YatlTableSearchEvent;
  [YatlTableStateChangeEvent.EVENT_NAME]: YatlTableStateChangeEvent;
  [YatlTableViewChangeEvent.EVENT_NAME]: YatlTableViewChangeEvent;
};

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
