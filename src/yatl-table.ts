import type {
  ColumnFilterCallback,
  ColumnOptions,
  ColumnPropertyRecord,
  ColumnState,
  Compareable,
  DisplayColumnOptions,
  FilterCallback,
  Filters,
  NestedKeyOf,
  QueryToken,
  RestorableColumnState,
  RestorableTableState,
  RowPartsCallback,
  RowSelectionMethod,
  SortOrder,
  SortState,
  StorageOptions,
  TableState,
  TokenizerCallback,
  UnspecifiedRecord,
} from './types';

import {
  createRegexTokenizer,
  getNestedValue,
  highlightText,
  isCompareable,
  isDisplayColumn,
  isInternalColumn,
  toHumanReadable,
  whitespaceTokenizer,
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
  YatlChangeEvent,
  YatlColumnReorderEvent,
  YatlColumnResizeEvent,
  YatlColumnToggleEvent,
  YatlRowClickEvent,
  YatlSearchEvent,
  YatlSortEvent,
  YatlStateChangeEvent,
} from './events';
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
  'columnSort',
  'columnOrder',
  'columnVisibility',
  'columnWidths',
  'storageOptions',
]);

const MATCH_WEIGHTS = {
  EXACT: 100,
  PREFIX: 50,
  SUBSTRING: 10,
};

// #endregion

/**
 * Represents a dynamic and interactive table with features like sorting, searching, filtering,
 * column resizing, column rearranging, and virtual scrolling.
 */
@customElement('yatl-table')
export class YatlTable<
  T extends object = UnspecifiedRecord,
> extends LitElement {
  public static override styles = [styles];

  @query('.table')
  private tableElement!: HTMLElement;
  @query('lit-virtualizer')
  private virtualizer?: LitVirtualizer;
  @query('.header')
  private headerElement!: HTMLElement;
  @query('.header-cell.cell-index')
  private headerIndexCellElement?: HTMLElement;

  // #region --- State Data ---

  // Property data
  private _enableSearchTokenization = false;
  private _enableSearchScoring = false;
  // Original options passed by the user
  private _columns: ColumnOptions<T>[] = [];
  // Options mapped by field for faster lookup
  private _columnDefinitionMap = new Map<NestedKeyOf<T>, ColumnOptions<T>>();
  private _columnStateMap = new Map<NestedKeyOf<T>, ColumnState<T>>();
  private _columnOrder: NestedKeyOf<T>[] = [];
  private _storageOptions: StorageOptions | null = null;
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
    for (const column of this.columns) {
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

  /**
   * The current visibility state of all columns.
   * **This will always be ordered by {@link YatlTable.columnOrder}**
   */
  @property({ attribute: false })
  public get columnVisibility() {
    const data: ColumnPropertyRecord<T, boolean> = {};
    for (const field of this.columnOrder) {
      data[field] = this.getOrCreateColumnState(field).visible;
    }
    return data;
  }

  public set columnVisibility(columns) {
    const oldValue = this.columnVisibility;

    let changed = false;
    const entries = Object.entries(columns) as [NestedKeyOf<T>, boolean][];
    for (const [field, visible] of entries) {
      const columnState = this.getOrCreateColumnState(field);
      if (columnState.visible !== visible) {
        changed = true;
        columnState.visible = visible;
      }
    }

    if (!changed) {
      return;
    }

    this.requestUpdate('columnVisibility', oldValue);
  }

  /**
   * The current sort state of all columns.
   * **This will always be orderd by {@link YatlTable.columnOrder}**
   */
  @property({ attribute: false })
  public get columnSort() {
    const data: ColumnPropertyRecord<T, SortState> = {};
    for (const field of this.columnOrder) {
      const sortState = this.getOrCreateColumnState(field).sort;
      // Always return a copy of the state so the user can't modify it
      data[field] = sortState ? { ...sortState } : null;
    }
    return data;
  }

  public set columnSort(columns) {
    const oldValue = this.columnSort;

    let changed = false;
    const entries = Object.entries(columns) as [NestedKeyOf<T>, SortState][];
    for (const [field, state] of entries) {
      const columnState = this.getOrCreateColumnState(field);
      if (
        columnState &&
        (columnState.sort?.order !== state?.order ||
          columnState.sort?.priority !== state?.priority)
      ) {
        changed = true;
        columnState.sort = state;
      }
    }

    if (!changed) {
      return;
    }

    this.sortDirty = true;
    this.requestUpdate('columnSort', oldValue);
  }

  /**
   * The current width of all columns.
   * **This will always be ordered by {@link YatlTable.columnOrder}**
   */
  @property({ attribute: false })
  public get columnWidths() {
    const data: ColumnPropertyRecord<T, number | null> = {};
    for (const field of this.columnOrder) {
      data[field] = this.getOrCreateColumnState(field).width;
    }
    return data;
  }

  public set columnWidths(columns) {
    const oldValue = this.columnWidths;

    let changed = false;
    const entries = Object.entries(columns) as [
      NestedKeyOf<T>,
      number | null,
    ][];
    for (const [field, width] of entries) {
      const columnState = this.getOrCreateColumnState(field);
      if (columnState.width !== width) {
        changed = true;
        columnState.width = width;
      }
    }

    if (!changed) {
      return;
    }

    this.requestUpdate('columnWidths', oldValue);
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
   */
  @property({ type: String })
  public rowSelection: RowSelectionMethod = null;

  @property({ type: Boolean })
  public showIndexColumn = false;

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
  public getState(): TableState<T> {
    return {
      searchQuery: this.searchQuery,
      filters: this.filters,
      columnOrder: this.columnOrder,
      columns: this.columns.map(column => {
        const state = this.getOrCreateColumnState(column.field);
        return {
          field: column.field,
          visible: state.visible,
          sort: state.sort,
          width: state.width,
        };
      }),
    };
  }

  /**
   * Restores the table to the provided state.
   * @param state - The state to restore the table to.
   */
  public restoreState(state: RestorableTableState<T>) {
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
        const currentState = this.getOrCreateColumnState(newState.field);

        if (!newState) {
          continue;
        }

        if ('visible' in newState && newState.visible !== undefined) {
          currentState.visible = newState.visible;
        }

        if ('sort' in newState && newState.sort !== undefined) {
          currentState.sort = newState.sort;
        }

        if ('width' in newState && newState.width !== undefined) {
          currentState.width = newState.width;
        }
      }
      this.requestUpdate();
    }
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
    const sortStates = this.columnSort;
    let state = sortStates[field];
    if (state === undefined) {
      throw new Error(`Cannot get options for non-existent column "${field}"`);
    }

    if (order === state?.order) {
      return;
    }

    if (!this.dispatchEvent(new YatlSortEvent(field, order))) {
      return;
    }

    // Column was unsorted, give it a new priority
    if (order && !state) {
      // Create a list of current sort priorities
      const priorities = [...this._columnStateMap.values()]
        .map(state => state.sort?.priority)
        .filter(priority => priority !== undefined);

      const maxPriority = this.columns.length + 1;
      const priority = Math.min(maxPriority, ...priorities) - 1;
      state = { order, priority };
    } else if (order && state) {
      // Column was sorted, just updated the order
      state.order = order;
    } else {
      state = null;
    }

    sortStates[field] = state;

    // Clear all other sorting
    if (clear) {
      for (const otherField of this.columnOrder) {
        if (otherField !== field) {
          sortStates[otherField] = null;
        }
      }
    }

    this.columnSort = { ...sortStates };
  }

  /**
   * Sets the visibility of a specified column.
   * @param field - The field name of the column.
   * @param visible - `true` to show the column, `false` to hide it.
   */
  public setColumnVisibility(field: NestedKeyOf<T>, visible: boolean) {
    const visibilityStates = this.columnVisibility;
    const currentVisibility = visibilityStates[field];
    if (currentVisibility === undefined) {
      throw new Error(`Cannot get options for non-existent column "${field}"`);
    }

    if (currentVisibility === visible) {
      return;
    }

    if (!this.dispatchEvent(new YatlColumnToggleEvent(field, visible))) {
      return;
    }

    visibilityStates[field] = visible;
    this.columnVisibility = { ...visibilityStates };
  }

  /**
   * Toggles the visibility of hte specified column
   * @param field - The field name of the column to toggle.
   */
  public toggleColumnVisibility(field: NestedKeyOf<T>) {
    const state = this.getOrCreateColumnState(field);
    // If state is null here becuase the column doesn't exist
    // setColumnVisibility will throw an error. We don't need to.
    this.setColumnVisibility(field, !state.visible);
  }

  /**
   * Shows the specified column
   * @param field - The field name of the column to show.
   */
  public showColumn(field: NestedKeyOf<T>) {
    this.setColumnVisibility(field, true);
  }

  /**
   * Hides the specified column
   * @param field - The field name of the column to hide.
   */
  public hideColumn(field: NestedKeyOf<T>) {
    this.setColumnVisibility(field, false);
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
   * Finds the first row
   * @param field
   * @param value
   * @returns
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
  public updateRow(index: number, data: Partial<T>) {
    const current_row = this.data[index];
    if (current_row) {
      Object.assign(current_row, data);
      this.requestUpdate('data');
    }
  }

  /**
   * Deletes a row at a specific original index from the table.
   * @param index - The original index of the row to delete.
   */
  public deleteRow(index: number) {
    this.data = this.data.toSpliced(index, 1);
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
      ` : nothing;
  }

  protected renderHeaderCell(field: NestedKeyOf<T>) {
    const column = this.getDisplayColumn(field);
    if (!column) {
      return nothing;
    }

    const state = this.getOrCreateColumnState(field);
    if (!state.visible) {
      return nothing;
    }

    const classes = {
      cell: true,
      sortable: column.sortable ?? this.sortable,
    };

    return html`
      <div
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
            ${column.title ?? toHumanReadable(column.field)}
          </span>
          ${this.renderColumnSortIcon(column, state)}
        </div>
        ${this.renderColumnResizer(column, state)}
        <div part="drop-indicator" class="drop-indicator"></div>
      </div>
    `;
  }

  protected renderSelectionHeader() {
    return this.isIndexColumnVisible()
      ? html`<div part="cell header-cell" class="cell header-cell cell-index"></div>`
      : nothing;
  }

  protected renderHeader() {
    const classes = {
      header: true,
      row: true,
      reorderable: this.enableColumnReorder,
    };
    return html`
      <div part="header" class=${classMap(classes)}>
        ${this.renderSelectionHeader()}
        ${this.columnOrder.map(field => this.renderHeaderCell(field))}
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

    const state = this.getOrCreateColumnState(field);
    if (!state.visible) {
      return;
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

    return html`
      <div
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
    `;
  }

  protected renderSelectionInput(metadata: RowMetadata) {
    if (!this.rowSelection) {
      return nothing;
    }

    return html`<input 
      part="row-checkbox" 
      class="row-checkbox" 
      type="checkbox" 
      ?checked=${metadata.selected} 
      @change=${(event: Event) =>
        this.handleRowSelectionClicked(event, metadata)}
      />
    `;
  }

  protected renderIndexCell(index: number, metadata: RowMetadata) {
    if (!this.isIndexColumnVisible()) {
      return nothing;
    }

    return html`
      <div 
        part="cell body-cell cell-selection" 
        class="cell body-cell cell-selection">
          ${this.showIndexColumn ? index : nothing}
          ${this.renderSelectionInput(metadata)}
      </div>
    `
  }

  protected renderRow(row: T, index: number) {
    const metadata = this.rowMetadata.get(row)!;
    let userParts = this.rowParts?.(row) ?? '';
    if (Array.isArray(userParts)) {
      userParts = userParts.join(' ');
    }

    return html`
      <div
        part=${'row ' + userParts}
        class="row"
        data-index=${metadata.index}
        data-filtered-index=${index}
      >
        ${this.renderIndexCell(index, metadata)}
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
      item => this.rowMetadata.get(item)!.index,
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

    return html`
      <div class="wrapper">
        <div class="scroller">
          <div
            part="table"
            class="table"
            style=${styleMap({ '--grid-template': gridTemplate })}
          >
            ${this.renderHeader()}
            <div class="body">
              <slot>${this.renderBodyContents()}</slot>
            </div>
          </div>
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }

  // #endregion

  // #region --- Lifecycle Methods ---

  protected override updated(changedProperties: PropertyValues<YatlTable<T>>) {
    super.updated(changedProperties);

    super.updated(changedProperties);

    // We check if any of the properties that affect visual state were updated.
    const stateProps: (keyof YatlTable<T>)[] = [
      'columnOrder',
      'columnVisibility',
      'columnSort',
      'columnWidths',
      'searchQuery',
      'filters',
    ];

    const changedStateProp = stateProps.filter(prop =>
      changedProperties.has(prop),
    );

    // 2. Dispatch the "After" event
    if (changedStateProp.length) {
      // We pass the new, fully resolved state
      this.dispatchEvent(
        new YatlStateChangeEvent(this.getState(), changedStateProp),
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
    this.dispatchEvent(new YatlChangeEvent(this.data));
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

    const aIsNull = aValue == null;
    const bIsNull = bValue == null;

    if (aIsNull && !bIsNull) return -1;
    if (bIsNull && !aIsNull) return 1;

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
    this.rowMetadata = new WeakMap();

    let index = 0;
    for (const row of this.data) {
      // Add the index
      const metadata: RowMetadata = {
        index: index++,
        searchTokens: {},
        searchValues: {},
        sortValues: {},
        selected: false,
      };
      this.rowMetadata.set(row, metadata);

      for (const column of this.columns) {
        const value = getNestedValue(row, column.field);

        // Cache precomputed values for sorting
        if (typeof column.sorter === 'function') {
          metadata.sortValues[column.field] = column.sorter(value);
        } else if (typeof value === 'string') {
          metadata.sortValues[column.field] = value.toLocaleLowerCase();
        } else if (isCompareable(value)) {
          metadata.sortValues[column.field] = value;
        } else {
          metadata.sortValues[column.field] = String(value);
        }

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

  private isIndexColumnVisible() {
    return this.rowSelection || this.showIndexColumn;
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

    if (this.isIndexColumnVisible()) {
      widths.push('var(--yatl-selection-column-width, 48px)');
    }

    for (const field of this.columnOrder) {
      const state = this.getOrCreateColumnState(field);
      if (state.visible) {
        if (state.width != null) {
          widths.push(`${state.width}px`);
        } else {
          widths.push('1fr');
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
    let state = this._columnStateMap.get(field);
    if (!state) {
      state = {
        field,
        visible: true,
        width: null,
        sort: null,
      };
      this._columnStateMap.set(field, state);
    }
    return state;
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
    const tableState = this.getState();

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

      this.restoreState(tableStateToRestore);
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
    // Ignore header click events while resizing
    if (this.resizeState) {
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

    const rowIndex = this.rowMetadata.get(row)!.index;
    this.dispatchEvent(new YatlRowClickEvent(row, rowIndex, field, event));
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

    if (this.isIndexColumnVisible()) {
      columnIndex++;
    }

    this.headerElement.classList.add('resizing');

    // Freeze the current widths as soon as the users starts resizing
    this.tableElement
      .querySelectorAll<HTMLElement>('.header .cell')
      .forEach(element => {
        const field = element.dataset.field;
        if (field) {
          const state = this.getOrCreateColumnState(field as NestedKeyOf<T>);
          if (state) {
            state.width = element.getBoundingClientRect().width;
          }
        }
      });

    this.resizeState = {
      active: true,
      startX: event.pageX,
      startWidth: header.getBoundingClientRect().width,
      columnIndex: columnIndex,
      columnField: field,
      currentWidths: this.getGridWidths(),
    };

    this.tableElement.style.setProperty(
      '--grid-template',
      this.resizeState.currentWidths.join(' '),
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

    this.headerElement.classList.remove('resizing');

    if (this.resizeState?.active) {
      event.preventDefault();
      event.stopPropagation();

      // Calculate the final width based on the DOM's current style
      const finalWidth = parseFloat(
        this.resizeState.currentWidths[this.resizeState.columnIndex],
      );
      const columnWidths = this.columnWidths;
      columnWidths[this.resizeState.columnField] = finalWidth;
      // We need to trigger a lifecycle update
      // to force any logic from updating the width.
      // Right now this is just the save state logic.
      this.columnWidths = { ...columnWidths };

      this.dispatchEvent(
        new YatlColumnResizeEvent(this.resizeState.columnField, finalWidth),
      );
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

    const newColumnOrder = [...this.columnOrder];
    const dragIndex = newColumnOrder.findIndex(col => col === this.dragColumn);
    const dropIndex = newColumnOrder.findIndex(col => col === field);

    if (dragIndex > -1 && dropIndex > -1) {
      const [draggedColumn] = newColumnOrder.splice(dragIndex, 1);
      const droppedColumn = this.getColumn(field);
      if (!droppedColumn) return;

      newColumnOrder.splice(dropIndex, 0, draggedColumn);
      const reorderEvent = new YatlColumnReorderEvent(
        draggedColumn,
        droppedColumn.field,
        newColumnOrder,
      );
      if (!this.dispatchEvent(reorderEvent)) {
        return;
      }

      this.columnOrder = [...newColumnOrder];
    }
  };

  private handleDragColumnEnd = () => {
    this.dragColumn = null;
    // Clean up just in case
    this.tableElement
      .querySelectorAll('.drop-indicator.active')
      .forEach(element => element.classList.remove('active'));
  };

  private handleRowSelectionClicked = (event: Event, metadata: RowMetadata) => {
    const input = event.currentTarget as HTMLInputElement;
    const row = input.closest('.row') as HTMLElement;
    row.classList.toggle('selected', input.checked)
    metadata.selected = input.checked;
  }

  // #endregion

  // #region --- Event Target ---

  public override addEventListener<K extends keyof EventMap<T>>(
    type: K,
    listener: (this: EventMap<T>, ev: EventMap<T>[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;

  public override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  public override addEventListener(
    type: string,
    listener: unknown,
    options?: boolean | AddEventListenerOptions,
  ) {
    super.addEventListener(
      type,
      listener as EventListenerOrEventListenerObject,
      options,
    );
  }

  public override removeEventListener<K extends keyof EventMap<T>>(
    type: K,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;

  public override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener, options);
  }

  public override dispatchEvent<K extends keyof EventMap<T>>(
    event: EventMap<T>[K],
  ): boolean {
    return super.dispatchEvent(event);
  }

  // #endregion
}

interface RowMetadata {
  index: number;
  searchScore?: number;
  /** Precomputed search tokens */
  searchTokens: Record<string, string[]>;
  /** Precomputed search values */
  searchValues: Record<string, string>;
  /** Precomputed sort values */
  sortValues: Record<string, Compareable>;
  highlightIndices?: Record<string, [number, number][]>;
  selected: boolean;
}

interface SearchResult {
  score: number;
  ranges: [number, number][]; // Array of [start, end] tuples
}

/**
 * Defines the mapping between event names and their detail object types.
 */
interface EventMap<T> {
  'yatl-row-click': YatlRowClickEvent<T>;
  'yatl-change': YatlChangeEvent<T>;
  'yatl-sort': YatlSortEvent<T>;
  'yatl-column-toggle': YatlColumnToggleEvent<T>;
  'yatl-column-resize': YatlColumnResizeEvent<T>;
  'yatl-column-reorder': YatlColumnReorderEvent<T>;
  'yatl-search': YatlSearchEvent;
  'yatl-state-change': YatlStateChangeEvent<T>;
}

declare global {
  interface HTMLElementTagNameMap {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'yatl-table': YatlTable<any>;
  }
}

export {
  createRegexTokenizer,
  isDisplayColumn,
  isInternalColumn,
  whitespaceTokenizer,
};
