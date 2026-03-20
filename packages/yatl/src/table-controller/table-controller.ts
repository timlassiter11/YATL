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
  RowMatchIndices,
  RowSelectionMethod,
  SortOrder,
  StorageOptions,
  TableControllerOptions,
  TableState,
  UnspecifiedRecord,
  YatlCommitRecord,
  YatlCommitTransaction,
  YatlTableControllerApi,
} from '../types';

import {
  createState,
  getColumnStateChanges,
  getNestedValue,
  isDisplayColumn,
  isRowIdType,
  isRowSelectionMethod,
  setNestedValue,
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
import { YatlSearchEngine } from '../search/search';
import { throwRowNotFound, YatlError } from '../utils/errors';
import { TypedEventTarget } from '../utils/typed-event-target';

// #region Constants

// Debounce between state saves
const STATE_SAVE_DEBOUNCE = 1000;

const DEFAULT_STORAGE_OPTIONS: Partial<StorageOptions> = {
  storage: window.localStorage,
  saveColumnSortOrders: true,
  saveColumnVisibility: true,
  saveColumnWidths: true,
  saveColumnOrder: true,
  saveSelectedRows: true,
};

// #endregion

export class YatlTableController<T extends object = UnspecifiedRecord>
  extends TypedEventTarget<ControllerEventMap>
  implements ReactiveController, YatlTableControllerApi<T>
{
  // #region State Data

  // Property data
  private hosts = new Set<ReactiveControllerHost>();

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
  private _filters: Filters<T> | FilterCallback<T> | null = null;

  // Flag if we have already restored the state or not.
  private hasRestoredState = false;

  // save state debounce timer
  private saveTimer = 0;

  // Flags set when something changes that
  // requires the filter or sort logic to re-run.
  private filterDirty = false;
  private sortDirty = false;

  private searchEngine = new YatlSearchEngine<T>();

  // Maps rows ids to their metadata
  private rowMetadata = new Map<RowId, RowMetadata>();
  // Maps row objects to their generated IDs
  private rowToIdMap = new WeakMap<T, RowId>();
  // Map row ids to their rows for faster lookup
  private idToRowMap = new Map<RowId, T>();
  // List of tokens created from the current query
  private queryTokens: QueryToken[] | null = null;
  // List of rows with pending edits. Just for quick lookup
  private editedRows = new Set<RowId>();
  // Transactions that have been started but not finished
  private pendingTransactions = new Map<string, YatlCommitRecord<T>[]>();

  // #endregion

  // #region Properties

  public get columns() {
    return [...this._columns];
  }

  public set columns(columns) {
    this._columns = [...columns];
    this.filterDirty = true;

    // Cache these in a map for faster lookups
    this._columnDefinitionMap = new Map();
    const searchFields = [];
    for (const column of columns) {
      this._columnDefinitionMap.set(column.field, column);
      if (column.searchable) {
        searchFields.push(column);
      }
    }
    this.searchEngine.searchFields = searchFields;
    this.rebuildMetadata();
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

  public get data() {
    return [...this._data];
  }

  public set data(data: T[]) {
    if (this._data === data) {
      return;
    }

    this._data = [...data];
    this.rebuildMetadata();
    this._dataUpdateTimestamp = new Date();
    this.filterDirty = true;
    this.searchEngine.data = data;
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

  public get searchQuery() {
    return this._searchQuery;
  }

  public set searchQuery(query) {
    if (this._searchQuery === query) {
      return;
    }

    this._searchQuery = query;
    this.filterDirty = true;
    this.requestUpdate('searchQuery');
  }

  public get tokenizedSearch() {
    return this.searchEngine.tokenizedSearch;
  }

  public set tokenizedSearch(enable) {
    if (this.tokenizedSearch === enable) {
      return;
    }

    this.searchEngine.tokenizedSearch = enable;
    this.filterDirty = true;
    this.requestUpdate('tokenizedSearch');
  }

  public get scoredSearch() {
    return this.searchEngine.scoredSearch;
  }

  public set scoredSearch(enable) {
    if (this.scoredSearch === enable) {
      return;
    }

    this.searchEngine.scoredSearch = enable;
    this.filterDirty = true;
    this.requestUpdate('scoredSearch');
  }

  public get searchTokenizer() {
    return this.searchEngine.tokenizer;
  }

  public set searchTokenizer(tokenizer) {
    if (this.searchTokenizer === tokenizer) {
      return;
    }

    this.searchEngine.tokenizer = tokenizer;
    this.filterDirty = true;
    this.requestUpdate('searchTokenizer');
  }

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

  public get rowIdCallback() {
    return this._rowIdCallback;
  }

  public set rowIdCallback(callback) {
    if (this._rowIdCallback === callback) {
      return;
    }

    // Update IDs in metadata for existing data.
    for (let i = 0; i < this.data.length; ++i) {
      const row = this.data[i];
      const oldId = this._rowIdCallback(row, i);
      const newId = callback(row, i);

      const metadata = this.rowMetadata.get(oldId);
      this.rowMetadata.delete(oldId);
      if (metadata) {
        this.rowMetadata.set(newId, metadata);
      }
    }
    this._rowIdCallback = callback;
    this.requestUpdate('rowIdCallback');
  }

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
      if (options.scoredSearch !== undefined)
        this.scoredSearch = options.scoredSearch;
      if (options.tokenizedSearch !== undefined)
        this.tokenizedSearch = options.tokenizedSearch;
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
      if (!Array.isArray(value)) {
        value = [value];
      }
      for (const item of value as unknown[]) {
        if (item != null || includeNull) {
          const valueCount = values.get(item) ?? 0;
          values.set(item, valueCount + 1);
        }
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
            value = String(value ?? '').replace('"', '""');
            list.push(`"${value}"`);
          }
        }
        return list.join(',');
      })
      .join('\n');

    const csvContent = csvHeaders + '\n' + csvRows;
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8,' });
  }

  public setPendingValue(
    row: T | RowId,
    field: NestedKeyOf<T>,
    value: unknown,
  ) {
    row = this.getRowOrThrow(row);
    const currentValue = getNestedValue(row, field);
    const metadata = this.getRowMetadata(row);
    if (value === currentValue) {
      metadata.pendingEdits.delete(field);
      if (metadata.pendingEdits.size === 0) {
        this.editedRows.delete(metadata.id);
      }
    } else {
      metadata.pendingEdits.set(field, value);
      this.editedRows.add(metadata.id);
    }
  }

  /**
   * Gets the latest value for the cell at the given row and field.
   * This will prioritize live edits first, pending commit transactions second
   * and finally the actual value in the row data.
   * @param row
   * @param field
   * @returns
   */
  public getLatestValue(row: T | RowId, field: NestedKeyOf<T>) {
    row = this.getRowOrThrow(row);
    const metadata = this.getRowMetadata(row);

    let value = metadata.pendingEdits.get(field);
    if (value !== undefined) {
      return value;
    }

    value = metadata.pendingTransactions.get(field)?.value;
    if (value !== undefined) {
      return value;
    }

    return getNestedValue(row, field);
  }

  public getCellStatus(row: T | RowId, field: NestedKeyOf<T>) {
    const metadata = this.getRowMetadata(row);
    if (!metadata) return 'clean';

    if (metadata.pendingTransactions.has(field as string)) {
      return 'saving';
    }

    if (metadata.pendingEdits.has(field as string)) {
      return 'dirty';
    }

    return 'clean';
  }

  public isCellEditable(row: T | RowId, field: NestedKeyOf<T>) {
    row = this.getRowOrThrow(row);
    const col = this.getDisplayColumn(field);
    if (!col || !col.editor || !col.editor.canEdit(field, row)) {
      return false;
    }

    const metadata = this.getRowMetadata(row);
    return !metadata.pendingTransactions.has(field);
  }

  public getPendingChanges() {
    return this.getTransactionRecords();
  }

  public createCommitTransaction(): YatlCommitTransaction | null {
    const transactionId = crypto.randomUUID();
    const records = this.getTransactionRecords(transactionId);
    if (records.length === 0) return null;

    this.pendingTransactions.set(transactionId, records);
    // Need to tell the table to update the status
    this.requestUpdate();
    return { id: transactionId, records };
  }

  public resolveTransaction(id: string) {
    this.closeTransaction(id, 'resolve');
  }

  public rejectTransaction(id: string) {
    this.closeTransaction(id, 'reject');
  }

  public discardTransaction(id: string) {
    this.closeTransaction(id, 'discard');
  }

  public commitChanges(row: T | RowId, field: NestedKeyOf<T>, update = true) {
    row = this.getRowOrThrow(row);
    const metadata = this.getRowMetadata(row);
    const currentValue = metadata.pendingEdits.get(field);
    if (currentValue !== undefined) {
      setNestedValue(row, field, currentValue);
      this.editedRows.delete(metadata.id);
      if (update) {
        this.requestUpdate('data');
      }
    }
  }

  public async commitAllChanges() {
    for (const rowId of this.editedRows) {
      const metadata = this.getRowMetadata(rowId);
      for (const field of metadata.pendingEdits.keys()) {
        this.commitChanges(rowId, field as NestedKeyOf<T>, false);
      }
    }
    this.requestUpdate('data');
  }

  public async revertPendingChanges() {
    for (const rowId of this.editedRows) {
      const row = this.getRow(rowId)!;
      const metadata = this.getRowMetadata(row);
      metadata.pendingEdits.clear();
    }
    this.requestUpdate();
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
      return this.getRowMetadata(row).index;
    }
    return -1;
  }

  public updateRow(rowId: RowId, data: Partial<T>) {
    const row = this.idToRowMap.get(rowId);
    if (row) {
      this.updateRowData(row, data);
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
      this.updateRowData(row, data);
    }
  }

  /**
   * Deletes the row with the matching ID.
   * @param rowIds - The IDs rows to delete
   */
  public deleteRow(...rowIds: RowId[]) {
    for (const rowId of rowIds) {
      try {
        const metadata = this.getRowMetadata(rowId);
        this.deleteRowAtIndex(metadata.index);
      } catch {
        // We don't care if they try to delete a row that doesn't actually exist.
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
        const metadata = this.getRowMetadata(row);
        this.idToRowMap.delete(metadata.id);
        this.rowMetadata.delete(metadata.id);
        this.editedRows.delete(metadata.id);
        newSelectedRows.delete(metadata.id);
        this.data = this.data.toSpliced(index, 1);
      }
    }
    this.selectedRowIds = [...newSelectedRows];
  }

  public getRowId(row: T) {
    const id = this.rowToIdMap.get(row);
    if (id === undefined) {
      throw new YatlError(
        'The provided row object does not exist in the current dataset.',
        'Ensure you are passing a reference from the active data array.',
      );
    }
    return id;
  }

  public getRowIndex(row: T) {
    return this.getRowMetadata(row).index;
  }

  public getRowHighlightIndicies(row: T) {
    return this.getRowMetadata(row).highlightIndices;
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

    if (props.includes('data')) {
      this.filterDirty = true;
    }

    for (const host of this.hosts) {
      host.requestUpdate();
    }
  }

  // #endregion

  // #region Filter Methods

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
    const baseData = this._data.filter((row, i) => this.filterRow(row, i));
    if (this.searchQuery && this.searchEngine) {
      // The engine returns SearchResult objects, so we map them back
      const searchResults = this.searchEngine.search(
        this.searchQuery,
        baseData,
      );

      // We update our metadata map with the new highlight indices and scores!
      this._filteredData = searchResults.map(res => {
        const meta = this.getRowMetadata(res.item);
        meta.searchScore = res.score;
        meta.highlightIndices = res.matches;
        return res.item;
      });
    } else {
      this._filteredData = baseData;
    }

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

    const aMetadata = this.getRowMetadata(a);
    const bMetadata = this.getRowMetadata(b);

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
      const aMetadata = this.getRowMetadata(a);
      const bMetadata = this.getRowMetadata(b);

      // Try to sort by search score if we're using scoring and there is a query.
      if (this.scoredSearch && this.searchQuery) {
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

  private rebuildMetadata() {
    this.idToRowMap = new Map();
    const rankMaps = new Map<string, Map<unknown, number>>();
    // TODO: We only need rank maps for sortable columns
    // but the user could enable sorting later. It's easiest
    // to just compute them all now regardless.
    for (const column of this.columns) {
      // Collect all raw values for this column
      const rawValues = this.data.map(row => {
        const originalValue = getNestedValue(row, column.field);
        const modifiedValue = column.sorter?.(originalValue) ?? originalValue;
        return [originalValue, modifiedValue] as [unknown, unknown];
      });
      rankMaps.set(column.field, createRankMap(rawValues));
    }

    this._data.forEach((row, index) => {
      let rowId = this._rowIdCallback(row, index);
      if (rowId == null || this.idToRowMap.has(rowId)) {
        warnInvalidIdFunction(index, rowId, row);
        rowId = `__yatl_fallback_id_${index}`;
      }

      const metadata =
        this.rowMetadata.get(rowId) ??
        ({
          id: rowId,
          index: index,
          searchTokens: {},
          searchValues: {},
          sortValues: {},
          selected: false,
          pendingEdits: new Map(),
          pendingTransactions: new Map(),
        } as RowMetadata);

      this.rowToIdMap.set(row, rowId);
      this.idToRowMap.set(rowId, row);
      this.rowMetadata.set(rowId, metadata);

      metadata.index = index;

      for (const column of this.columns) {
        const value = getNestedValue(row, column.field);
        const rankMap = rankMaps.get(column.field)!;
        metadata.sortValues[column.field] = rankMap.get(value) ?? null;
      }
    });
  }

  private updateRowData(row: T, data: object) {
    Object.assign(row, data);
    // TODO: Make this more efficient.
    this.rebuildMetadata();
    this.requestUpdate('data');
  }

  private scheduleSave() {
    window.clearTimeout(this.saveTimer);

    this.saveTimer = window.setTimeout(() => {
      this.saveStateToStorage();
    }, STATE_SAVE_DEBOUNCE);
  }

  private getRowOrThrow(row: T | RowId) {
    if (isRowIdType(row)) {
      row = this.getRow(row)!;
      if (!row) {
        throwRowNotFound(row);
      }
      return row;
    }
    return row;
  }

  private getRowMetadata(row: T | RowId) {
    const id = isRowIdType(row) ? row : this.getRowId(row);
    const metadata = this.rowMetadata.get(id);
    if (!metadata) {
      throw new YatlError(
        'The provided row object does not exist in the current dataset',
      );
    }
    return metadata;
  }

  /**
   * Gets the list of transaction records from the current edits.
   * @param transactionId If provied, moves the values from pending edits to pending transactions
   * @returns
   */
  private getTransactionRecords(transactionId?: string) {
    const records: YatlCommitRecord<T>[] = [];
    for (const rowId of this.editedRows) {
      const row = this.getRow(rowId);
      const metadata = this.rowMetadata.get(rowId);
      if (!row || !metadata || metadata.pendingEdits.size === 0) {
        continue;
      }

      const edits = metadata.pendingEdits;

      const changes: Partial<T> = {};
      const changedFields = [];
      const mergedRow = structuredClone(row);
      for (const [field, value] of edits.entries()) {
        changedFields.push(field as NestedKeyOf<T>);
        setNestedValue(changes, field, value);
        setNestedValue(mergedRow, field, value);
      }

      records.push({
        rowId: rowId,
        changedFields: changedFields,
        originalRow: row,
        changes: changes,
        mergedRow: mergedRow,
      });

      if (transactionId) {
        for (const [key, value] of edits.entries()) {
          metadata.pendingTransactions.set(key, { id: transactionId, value });
        }
        edits.clear();
      }
    }
    return records;
  }

  private closeTransaction(
    id: string,
    action: 'resolve' | 'reject' | 'discard',
  ) {
    const records = this.pendingTransactions.get(id);
    if (!records) {
      throw new YatlError(
        `Attempting to commit non-existent transaction ${id}`,
      );
    }

    for (const record of records) {
      const metadata = this.getRowMetadata(record.rowId);
      for (const field of record.changedFields) {
        const pendingData = metadata.pendingTransactions.get(field);
        if (pendingData?.id === id) {
          // If the data in pending transactions is still for this transactions
          if (action === 'reject' && !metadata.pendingEdits.has(field)) {
            // If the user is rejecting the transaction we want to keep the data
            metadata.pendingEdits.set(field, pendingData.value);
            this.editedRows.add(record.rowId);
          }
          metadata.pendingTransactions.delete(field);
        }
      }
      if (action === 'resolve') {
        this.updateRow(record.rowId, record.changes);
      }
    }
    this.pendingTransactions.delete(id);
    this.requestUpdate();
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

    const storage = options.storage ?? window.localStorage;

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
    const storage = options.storage ?? window.localStorage;

    const json = storage.getItem(options.key);
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
  /** Precomputed sort values */
  sortValues: Record<string, number | null>;
  highlightIndices?: RowMatchIndices;
  selected: boolean;
  pendingEdits: Map<string, unknown>;
  pendingTransactions: Map<string, { id: string; value: unknown }>;
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
