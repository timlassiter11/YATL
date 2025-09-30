import './data-table.css';

import {
  CellFormatterCallback,
  ColumnFilterCallback,
  ColumnOptions,
  ColumnState,
  ComparatorCallback,
  FilterCallback,
  Filters,
  LoadOptions,
  QueryToken,
  SortOrder,
  SortValueCallback,
  TableClasses,
  TableOptions,
  ValueFormatterCallback,
} from './types';

import {
  convertClasses,
  createRegexTokenizer,
  NestedKeyOf,
  toHumanReadable,
  virtualScrollToNumber,
} from './utils';
import { VirtualScroll, VirtualScrollError } from '../virtual-scroll/virtual-scroll';
import { IVirtualScroll } from '../virtual-scroll/types';

/**
 * Represents a dynamic and interactive table with features like sorting, searching, filtering,
 * column resizing, column rearranging, and virtual scrolling.
 *
 * @example
 * ```ts
 * type DataType = {id: number, name: string, age: number};
 *
 * const dataTable = new DataTable<DataType>('#myTable', [
 *     { field: 'id', title: 'ID', sortable: true },
 *     { field: 'name', title: 'Name', searchable: true },
 *     { field: 'age', title: 'Age', sortable: true, valueFormatter: (value) => `${value} years` }
 *   ], {
 *   data: [
 *     { id: 1, name: 'Alice', age: 30 },
 *     { id: 2, name: 'Bob', age: 24 },
 *   ],
 *   virtualScroll: true,
 *   resizable: true,
 *   rearrangeable: true,
 * });
 * ```
 */
export class DataTable<T> extends EventTarget {
  private static readonly MatchWeights = {
    EXACT: 100,
    PREFIX: 50,
    SUBSTRING: 10,
  };

  // Centralized default options for the DataTable.
  // These are the base values used if not overridden by user-provided options.
  private readonly DEFAULT_OPTIONS: RequiredOptions<T> = {
    virtualScroll: 1000,
    highlightSearch: true,
    tokenizeSearch: false,
    enableSearchScoring: false,
    sortable: true,
    resizable: true,
    rearrangeable: true,
    extraSearchFields: [],
    noDataText: 'No records found',
    noMatchText: 'No matching records found',
    classes: {
      scroller: ['dt-scroller'],
      thead: ['dt-headers'],
      tbody: [],
      tr: [],
      th: [],
      td: [],
      mark: [],
    },
    tokenizer: createRegexTokenizer(),
    virtualScrollClass: VirtualScroll
  };

  // Table elements
  #table: HTMLTableElement;
  #thead: HTMLElement;
  #tbody: HTMLElement;
  #scroller: HTMLElement;

  #columnData: Map<string, ColumnData<T>> = new Map();

  // Current data stored by the initial index
  #rows: Map<number, InternalRowData<T>> = new Map();
  #filteredRows: InternalRowData<T>[] = [];

  #userQuery?: string | RegExp;
  // Search and filter data
  #query?: QueryToken[] | RegExp;
  #filters!: Filters<T> | FilterCallback;

  #virtualScroll?: IVirtualScroll;

  #resizingColumn?: ColumnData<T>;

  #options: RequiredOptions<T>;

  #blockUpdates = false;

  /**
   * Initializes a new instance of the DataTable.
   * @param table - The HTMLTableElement or a CSS selector string for the table.
   * @param columns - List of {@link ColumnOptions} for the table.
   * @param options - Optional configuration options for the DataTable.
   * @throws {SyntaxError} If the table selector does not find an element.
   * @throws {TypeError} If the provided table element is not an HTMLTableElement or if columns option is not an array.
   */
  constructor(
    table: string | HTMLTableElement,
    columns: ColumnOptions<T>[],
    options: TableOptions<T> = {},
  ) {
    super();

    const classes = convertClasses(
      this.DEFAULT_OPTIONS.classes,
      options.classes,
    );
    const virtualScroll = virtualScrollToNumber(
      options.virtualScroll ?? this.DEFAULT_OPTIONS.virtualScroll,
    );

    // Setup the options initially to allow for the initialization logic to work
    this.#options = {
      ...this.DEFAULT_OPTIONS,
      ...options,
      // Override these with our computed values
      classes,
      virtualScroll,
    };

    // Search scoring is only useful with tokenization.
    if (this.#options.enableSearchScoring && !this.#options.tokenizeSearch) {
      this.#options.enableSearchScoring = false;
      console.warn(
        'Search scoring enabled with tokenization disabled... Ignoring',
      );
    }

    if (typeof table === 'string') {
      const tableElement = document.querySelector(table);
      if (!tableElement)
        throw new SyntaxError(`Failed to find table using selector ${table}`);
      this.#table = tableElement as HTMLTableElement;
    } else {
      this.#table = table;
    }

    if (!(this.#table instanceof HTMLTableElement)) {
      throw new TypeError(
        `Invalid table element type. Must be HTMLTableElement`,
      );
    }

    if (!Array.isArray(columns)) {
      throw new TypeError('columns must be a list of columns');
    }

    const { scroller, thead, headerRow, tbody } = this.#initTableElements();

    this.#scroller = scroller;
    this.#thead = thead;
    this.#tbody = tbody;

    this.#initColumns(columns, headerRow);
    this.updateOptions(options);

    this.loadData(options.data ?? []);
  }

  get options() {
    return structuredClone(this.#options);
  }

  /**
   * Gets or sets the state of all columns in the table.
   * This can be used to save and restore column configurations like visibility, sort order, and width.
   * When setting, it attempts to apply the states to existing columns.
   */
  get columnStates(): ColumnState<T>[] {
    return [...this.#columnData.values()].map(col => {
      return {
        field: col.field,
        title: col.title,
        visible: col.visible,
        sortOrder: col.sortOrder,
        sortPriority: col.sortPriority,
        width: col.headerElement.style.width,
      };
    });
  }

  set columnStates(states: ColumnState<T>[]) {
    for (const state of states) {
      const column = this.#columnData.get(state.field);
      if (!column) {
        console.warn(
          `Attempting to restore state for non-existent column ${state.field}`,
        );
        continue;
      }

      column.visible = state.visible ?? column.visible;
      column.sortOrder = state.sortOrder ?? column.sortOrder;
      column.sortPriority = state.sortPriority ?? column.sortPriority;
      column.headerElement.style.width =
        state.width ?? column.headerElement.style.width;
    }
    this.refresh();
  }

  /**
   * Gets the currently filtered and sorted rows displayed in the table.
   */
  get rows(): T[] {
    return [...this.#filteredRows];
  }

  /**
   * Gets the underlying data
   */
  get data(): T[] {
    return [...this.#rows.values()];
  }

  /**
   * Gets the underlying HTMLTableElement managed by this DataTable instance.
   */
  get table(): HTMLTableElement {
    return this.#table;
  }

  updateOptions(options: UpdatableOptions<T>) {
    let reRenderTable = false;
    let reApplyFilters = false;
    let reloadData = false;
    this.#blockUpdates = true;

    const {
      virtualScroll,
      highlightSearch,
      tokenizeSearch,
      enableSearchScoring,
      rearrangeable,
      extraSearchFields,
      noMatchText,
      noDataText,
      classes,
    } = options;

    if (virtualScroll !== undefined) {
      this.#options.virtualScroll = virtualScrollToNumber(virtualScroll);
      reRenderTable = true;
    }

    if (highlightSearch !== undefined) {
      this.#options.highlightSearch = highlightSearch;
      reRenderTable = true;
    }

    if (tokenizeSearch !== undefined) {
      this.#options.tokenizeSearch = tokenizeSearch;
      reloadData = true;
      this.search(this.#userQuery);
    }

    if (enableSearchScoring !== undefined) {
      this.#options.enableSearchScoring = enableSearchScoring;
      reApplyFilters = true;
    }

    if (rearrangeable !== undefined) {
      this.#options.rearrangeable = rearrangeable;
      for (const col of this.#columnData.values()) {
        col.headerElement.draggable = rearrangeable;
      }
    }

    if (extraSearchFields !== undefined) {
      this.#options.extraSearchFields = extraSearchFields;
      reloadData = true;
    }

    if (noMatchText !== undefined) {
      this.#options.noMatchText = noMatchText;
      if (this.rows.length === 0) {
        reRenderTable = true;
      }
    }

    if (noDataText !== undefined) {
      this.#options.noDataText = noDataText;
      if (this.rows.length === 0) {
        reRenderTable = true;
      }
    }

    if (classes !== undefined) {
      this.#options.classes = convertClasses(this.#options.classes, classes);
      this.#scroller.className = this.#options.classes.scroller.join(' ');
      this.#thead.className = this.#options.classes.thead.join(' ');
      this.#tbody.className = this.#options.classes.tbody.join(' ');
      for (const col of this.#columnData.values()) {
        col.headerElement.className = this.#options.classes.th.join(' ');
        this.updateColumnOptions(col.field, { sortable: col.sortable });
      }
      reRenderTable = true;
    }

    this.#blockUpdates = false;
    if (reloadData) {
      this.loadData(this.data);
    } else if (reApplyFilters) {
      this.#filterRows();
    } else if (reRenderTable) {
      this.#renderTable();
    }
  }

  updateColumnOptions(
    column: ColumnField<T>,
    options: UpdateableColumnOptions<T>,
  ) {
    const col = this.#columnData.get(column);
    if (!col) {
      throw new Error(`Cannot update non-existent column "${column}"`);
    }

    let reloadData = false;
    let reApplyFilters = false;
    let reSortRows = false;
    let reRenderTable = false;

    const {
      title,
      searchable,
      resizable,
      sortable,
      tokenize,
      valueFormatter,
      elementFormatter,
      sorter,
    } = options;

    if (title !== undefined) {
      col.titleElement.textContent = title;
      col.title = title;
    }

    if (searchable !== undefined) {
      col.searchable = searchable;
      reApplyFilters = true;
    }

    if (sortable !== undefined) {
      if (sortable) {
        col.headerElement.classList.add('dt-sortable');
      } else {
        col.headerElement.classList.remove('dt-sortable');
      }
      col.sortable = sortable;
    }

    if (resizable !== undefined) {
      if (resizable) {
        col.headerElement.classList.add('dt-resizeable');
      } else {
        col.headerElement.classList.remove('dt-resizeable');
      }
    }

    if (tokenize !== undefined) {
      col.tokenize = tokenize;
      reloadData = true;
    }

    if (valueFormatter !== undefined) {
      col.valueFormatter = valueFormatter;
      reRenderTable = true;
    }

    if (elementFormatter !== undefined) {
      col.elementFormatter = elementFormatter;
      reRenderTable = true;
    }

    if (sorter !== undefined) {
      col.sorterCallback = sorter;
      reSortRows = true;
    }

    if (reloadData) {
      this.loadData(this.data);
    } else if (reApplyFilters) {
      this.#filterRows();
    } else if (reSortRows) {
      this.#sortRows();
    } else if (reRenderTable) {
      this.#renderTable();
    }
  }

  /**
   * Loads data into the table
   * @param rows - An array of data to be loaded
   * @param options - Configuration for the load operation
   */
  loadData(rows: T[], options: LoadOptions = {}) {
    const scrollTop = this.#scroller.scrollTop;
    const scrollLeft = this.#scroller.scrollLeft;

    if (!options.append) {
      this.#rows.clear();
      this.#filteredRows = [];
    }

    let index = this.#rows.size;
    for (const row of rows as InternalRowData<T>[]) {
      const internal_row = this.#loadRow(row, index);
      this.#rows.set(index, internal_row);
      index++;
    }

    this.#updateHeaders();
    this.#filterRows();

    if (options.keepScroll) {
      this.#scroller.scrollTop = scrollTop;
      this.#scroller.scrollLeft = scrollLeft;
    }
  }

  /**
   * Displays a message in the table body, typically used for "no data" or "no results" states.
   * The message is shown in a single row spanning all columns.
   * @param text - The text or HTML message to display.
   * @param classes - A string or array of strings for CSS classes to apply to the message row.
   */
  showMessage(text: string, classes: string | string[]) {
    if (Array.isArray(classes)) {
      classes = classes.join(' ');
    } else if (typeof classes !== 'string') {
      classes = '';
    }

    const colSpan = this.#columnData.size;
    this.#tbody.innerHTML = `<tr class="${classes}"><td colSpan=${colSpan}>${text}</td></tr>`;
  }

  /**
   * Clears the current message and dispalsy the normal table data.
   */
  clearMessage() {
    this.#renderTable();
  }

  /**
   * Filters rows based on a search query.
   * The search is performed on columns marked as `searchable` and `extraSearchFields`.
   * @param query - The search term (string) or a regular expression. An empty string clears the search.
   */
  search(query?: string | RegExp) {
    this.#userQuery = query;

    // Clear search on empty string
    if (query === '') {
      query = undefined;
    }

    if (typeof query === 'string') {
      if (this.#options.tokenizeSearch) {
        this.#query = this.#options.tokenizer(query);
      } else {
        this.#query = [{ value: query.toLocaleLowerCase(), quoted: true }];
      }
    } else {
      this.#query = query;
    }

    this.#filterRows();
  }

  /**
   * Applies filters to the table rows.
   * Filters can be an object where keys are field names and values are the criteria to filter by,
   * or a callback function that receives a row and its index and returns `true` if the row should be included.
   * @param filters - An object defining field-based filters or a custom filter callback function.
   * @throws {TypeError} If `filters` is not an object or a function.
   */
  filter(filters?: Filters<T> | FilterCallback) {
    this.#filters = filters || {};
    this.#filterRows();
  }

  /**
   * Sorts the table by a specified column and order.
   * If `order` is `null`, the sort on this column is removed.
   * @param colName - The field name of the column to sort by.
   * @param order - The sort order: 'asc', 'desc', or `null` to remove sorting for this column.
   */
  sort(colName: string, order: SortOrder) {
    const col = this.#columnData.get(colName);
    if (!col) {
      console.warn(`Attempting to sort non-existent column ${colName}`);
      return;
    }

    if (order === col.sortOrder) {
      return;
    }

    if (order && !col.sortOrder) {
      const priorities = this.columnStates.map(col =>
        col.sortOrder ? col.sortPriority : 0,
      );
      col.sortPriority = Math.max(...priorities) + 1;
    }

    col.sortOrder = order;

    const sortEvent = new CustomEvent<DataTableEventMap<T>['dt.col.sort']>(
      'dt.col.sort',
      {
        cancelable: true,
        detail: {
          column: col.field,
          order: col.sortOrder,
        },
      },
    );

    if (!this.dispatchEvent(sortEvent)) {
      return;
    }

    const scrollTop = this.#scroller.scrollTop;
    const scrollLeft = this.#scroller.scrollLeft;

    this.#updateHeaders();
    this.#sortRows();

    this.#scroller.scrollTop = scrollTop;
    this.#scroller.scrollLeft = scrollLeft;
  }

  /**
   * Sets the visibility of a specified column.
   * @param colName - The field name of the column.
   * @param visisble - `true` to show the column, `false` to hide it.
   */
  setColumnVisibility(colName: string, visisble: boolean) {
    const col = this.#columnData.get(colName);
    if (!col) {
      console.warn(
        `Attempting to ${visisble ? 'show' : 'hide'
        } non-existent column ${colName}`,
      );
      return;
    }

    if (col.visible === visisble) {
      return;
    }

    const visibilityEvent = new CustomEvent<
      DataTableEventMap<T>['dt.col.visibility']
    >('dt.col.visibility', {
      cancelable: true,
      detail: {
        column: col.field,
        visible: visisble,
      },
    });

    if (!this.dispatchEvent(visibilityEvent)) {
      return;
    }

    col.visible = visisble;
    this.#updateHeaders();
    // If we hide a column that has sorting, we need to resort.
    // This will also handle hiding all of the columns elements.
    this.#sortRows();
  }

  /**
   * Shows a previously hidden column.
   * @param field - The field name of the column to show.
   */
  showColumn(field: string) {
    this.setColumnVisibility(field, true);
  }

  /**
   * Hides a visible column.
   * @param field - The field name of the column to hide.
   */
  hideColumn(field: string) {
    this.setColumnVisibility(field, false);
  }

  /**
   * Export the current visible table data to a CSV file.
   * @param filename - The name of the file to save.
   * @param all - If `true`, exports all original data (ignoring filters). If `false` (default), exports only the currently visible (filtered and sorted) rows.
   */
  export(filename: string, all = false) {
    const data = all ? this.#rows : this.#filteredRows;
    const rows = [...data.values()];

    const csvHeaders = [...this.#columnData.values()]
      .filter(col => all || col.visible)
      .map(col => `"${col.title}"`)
      .join(',');

    const csvRows = rows
      .map(row => {
        const list: string[] = [];
        for (const key of Object.keys(row)) {
          const col = this.#columnData.get(key);
          if (!col) {
            continue;
          }

          let value = (row as any)[key];
          if (all || !col.headerElement.hidden) {
            if (typeof col.valueFormatter === 'function') {
              value = col.valueFormatter(value, row);
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

  scrollToRow(row: T) {
    const rowData = row as InternalRowData<T>;
    const index = rowData._metadata?.index;
    if (typeof index === 'number') {
      this.scrollToOriginalIndex(index);
    } else {
      throw new TypeError('Invalid row');
    }
  }

  /**
   * Scrolls the table to bring the row at the specified original index into view.
   * @param index - The original index of the row (from the initial dataset).
   */
  scrollToOriginalIndex(index: number) {
    const rowData = this.#rows.get(index);
    if (rowData) {
      const filteredIndex = this.#filteredRows.indexOf(rowData);
      if (filteredIndex >= 0) {
        this.scrollToFilteredIndex(filteredIndex);
        return;
      } else {
        throw new Error('Cannot scroll to filtered out row');
      }
    } else {
      throw new RangeError(`Row index ${index} out of range`);
    }
  }

  scrollToFilteredIndex(index: number) {
    const rowData = this.#filteredRows[index];
    if (!rowData) {
      throw new RangeError(`Row index ${index} out of range`);
    }

    if (this.#virtualScroll) {
      this.#virtualScroll.scrollToIndex(index);
    } else {
      const row = this.#tbody.querySelector(
        `tr[data-dt-index="${rowData._metadata.index}"]`,
      );
      if (row) {
        row.scrollIntoView(true);
        const theadHeight = parseFloat(getComputedStyle(this.#thead).height);
        this.#scroller.scrollTop -= theadHeight;
      }
    }
  }

  scrollToPx(px: number) {
    if (this.#virtualScroll) {
      this.#virtualScroll.scrollToPx(px);
    } else {
      const theadHeight = parseFloat(getComputedStyle(this.#thead).height);
      this.#scroller.scrollTop -= theadHeight;
    }
  }

  /**
   * Sets the display order of the columns in the table.
   *
   * @param fields - An array of field names representing the new order of columns. Columns not included in the array will be placed at the end.
   * @throws {TypeError} If `fields` is not an array.
   */
  setColumnOrder(fields: string[]) {
    if (!Array.isArray(fields)) {
      throw new TypeError('fields must be an array of field names');
    }

    const newColumns = new Map<string, ColumnData<T>>();
    for (const field of fields) {
      const col = this.#columnData.get(field);
      if (col) {
        newColumns.set(field, col);
      }
    }

    for (const [field, col] of this.#columnData) {
      if (!newColumns.has(field)) {
        newColumns.set(field, col);
      }
    }

    this.#columnData = newColumns;
    this.refresh();
  }

  /**
   * Refreshes the table display. This re-applies filters, sorting, and updates headers and rows.
   */
  refresh() {
    this.#updateHeaders();
    this.#filterRows();
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
  indexOf(field: string, value: any) {
    const rows = [...this.#rows.values()];
    const found_row = rows.find(row => {
      if (field in row) {
        return (row as any)[field] === value;
      }
    });

    if (found_row) {
      return found_row._metadata.index;
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
  updateRow(index: number, data: Partial<T>) {
    const current_row = this.#rows.get(index);
    if (current_row) {
      Object.assign(current_row, data);
      this.#loadRow(current_row, index);
      this.#filterRows();
    }
  }

  /**
   * Deletes a row at a specific original index from the table.
   * @param index - The original index of the row to delete.
   */
  deleteRow(index: number) {
    this.#rows.delete(index);
    this.#filterRows();
  }

  /**
   * Executes a callback function without triggering table updates (like re-rendering or event dispatches)
   * until the callback has completed. This is useful for batching multiple operations.
   * @param callback - A function to execute. It receives the DataTable instance as its argument.
   * @example dataTable.withoutUpdates(dt => { dt.sort('name', 'asc'); dt.filter({ age: '>30' }); });
   */
  withoutUpdates(callback: (dataTable: DataTable<T>) => void) {
    this.#blockUpdates = true;
    try {
      callback(this);
    } finally {
      this.#blockUpdates = false;
      this.refresh();
    }
  }

  #initTableElements() {
    this.#table.classList.add('data-table');

    // Inner element that handles the virtual scroll.
    const scroller = document.createElement('div');
    scroller.style.overflow = 'auto';
    scroller.style.height = '100%';

    // If the user tries to provide a height, we will use that for the scroller.
    if (this.#table.style.height !== '') {
      scroller.style.height = this.#table.style.height;
      this.#table.style.height = '';
    }

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const tbody = document.createElement('tbody');

    tbody.addEventListener('click', this.#onTableClicked);

    // We currently don't support HTML based columns.
    // Clear the table and start fresh.
    // TODO: Add ability to use HTML headers provided by the user.
    this.#table.innerHTML = '';

    thead.append(headerRow);
    this.#table.append(thead);
    this.#table.append(tbody);

    // Add the scroller before the table so when we move the
    // table into the scroller it stays in the same place.
    this.#table.parentElement?.insertBefore(scroller, this.#table);
    scroller.append(this.#table);

    return {
      scroller,
      thead,
      headerRow,
      tbody,
    };
  }

  #initColumns(columns: ColumnOptions<T>[], headerRow: HTMLElement) {
    this.#columnData.clear();
    // We need to make sure at least one column is visible
    let colVisible = false;

    for (const colOptions of columns) {
      const header = document.createElement('th');
      const headerContent = document.createElement('div');
      const titleWrapper = document.createElement('div');
      const titleElement = document.createElement('span');

      colOptions.title ??= toHumanReadable(colOptions.field);
      colOptions.visible ??= true;
      colOptions.sortable ??= this.#options.sortable;
      colOptions.searchable ??= false;
      colOptions.tokenize = this.#options.tokenizeSearch
        ? (colOptions.tokenize ?? false)
        : false;

      const colData: ColumnData<T> = {
        field: colOptions.field,
        title: colOptions.title,
        headerElement: header,
        titleElement: titleElement,
        visible: colOptions.visible,
        sortable: colOptions.sortable,
        searchable: colOptions.searchable,
        // If tokenization is disabled globally, disable it on the columns.
        tokenize: colOptions.tokenize,
        sortOrder: colOptions.sortOrder ?? null,
        sortPriority: colOptions.sortPriority ?? 0,
        resizeStartWidth: null,
        resizeStartX: null,
        valueFormatter: colOptions.valueFormatter,
        elementFormatter: colOptions.elementFormatter,
        sorterCallback: colOptions.sorter,
        filterCallback: colOptions.filter,
        sortValueCallback: colOptions.sortValue,
      };

      this.#columnData.set(colOptions.field, colData);

      header.dataset.dtField = colOptions.field;
      header.hidden = !colData.visible;

      headerContent.classList.add('dt-header-content');
      header.append(headerContent);

      titleWrapper.classList.add('dt-header-title-wrapper');
      headerContent.append(titleWrapper);

      titleElement.classList.add('dt-header-title');
      titleElement.innerHTML = colData.title;
      titleWrapper.append(titleElement);

      const sorter = document.createElement('div');
      sorter.classList.add('dt-sort-icon');
      titleWrapper.append(sorter);

      const resizer = document.createElement('div');
      resizer.classList.add('dt-resizer');
      headerContent.append(resizer);

      headerRow.append(header);

      if (colData.visible) {
        colVisible = true;
      }

      this.updateColumnOptions(colOptions.field, colOptions);

      if (this.#options.rearrangeable) {
        header.draggable = true;
      }

      // Sort event listener
      titleWrapper.addEventListener('click', () => {
        if (!header.classList.contains('dt-sortable')) return;

        if (!colData.sortOrder) {
          this.sort(colData.field, 'asc');
        } else if (colData.sortOrder === 'asc') {
          this.sort(colData.field, 'desc');
        } else if (colData.sortOrder) {
          this.sort(colData.field, null);
        }
      });

      // Drag and drop event listeners
      header.addEventListener('dragstart', this.#onDragColumnStart);
      header.addEventListener('dragenter', this.#onDragColumnEnter);
      header.addEventListener('dragover', this.#onDragColumnOver);
      header.addEventListener('dragleave', this.#onDragColumnLeave);
      header.addEventListener('drop', this.#onDragColumnDrop);
      header.addEventListener('dragend', this.#onDragColumnEnd);
      // Resize event listeners
      header.addEventListener('mousedown', this.#onResizeColumnStart);
      header.addEventListener('dblclick', this.#onResizeColumnDoubleClick);

      if (typeof colOptions.width === 'number') {
        header.style.width = colOptions.width + 'px';
      } else if (typeof colOptions.width === 'string') {
        header.style.width = colOptions.width;
      }
    }

    if (this.#columnData.size === 0) {
      console.warn('No columns found. At least one column is required.');
    } else if (!colVisible) {
      console.warn(
        'At least a single column must be visible. Showing the first column.',
      );
      const col = columns[0].field;
      this.showColumn(col);
    }
  }

  #loadRow(row: InternalRowData<T>, index: number) {
    // Add the index
    const metadata: RowMetadata = {
      index: index++,
      tokens: {},
      compareValues: {},
      sortValues: {},
    };
    row._metadata = metadata;

    for (const [field, col] of this.#columnData) {
      const value = this.#getNestedValue(row, field);

      // Cache precomputed values for sorting
      if (typeof col.sortValueCallback === 'function') {
        metadata.sortValues[field] = col.sortValueCallback(value);
      } else if (typeof value === 'string') {
        metadata.sortValues[field] = value.toLocaleLowerCase();
      } else {
        metadata.sortValues[field] = value;
      }

      // Cache precomputed lower-case values for search
      if (typeof value === 'string') {
        metadata.compareValues[field] = value.toLocaleLowerCase();
      }

      // Tokenize any searchable columns
      if (col.searchable && col.tokenize && value) {
        metadata.tokens[field] = this.#options
          .tokenizer(value)
          .map(token => token.value);
      }
    }

    // Add any extra search fields
    for (const field of this.#options.extraSearchFields) {
      const value = this.#getNestedValue(row, field);
      // Cache precomputed lower-case values for search
      if (typeof value === 'string') {
        metadata.compareValues[field] = value.toLocaleLowerCase();
      }

    }

    return row;
  }

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
  #calculateSearchScore(query: string, target: string): number {
    if (!query || !target) {
      return 0;
    }

    let baseScore = 0;
    let matchTypeWeight = 0;

    if (target === query) {
      matchTypeWeight = DataTable.MatchWeights.EXACT;
      baseScore = query.length;
    } else if (target.startsWith(query)) {
      matchTypeWeight = DataTable.MatchWeights.PREFIX;
      baseScore = query.length;
    } else if (target.includes(query)) {
      matchTypeWeight = DataTable.MatchWeights.SUBSTRING;
      baseScore = query.length;
    } else {
      return 0;
    }

    // Reward matches where the query length is close to the target length.
    const lengthDifference = target.length - query.length;
    const specificityBonus = 1 / (1 + lengthDifference);

    // The final score is a combination of the match type's importance,
    // the base score from the query length, and the specificity bonus.
    return baseScore * matchTypeWeight * specificityBonus;
  }

  #searchField(
    query: QueryToken | RegExp,
    value: string,
    tokens?: string[],
  ): number {
    // RegExp bypasses tokenization and scoring
    if (query instanceof RegExp) {
      return query.test(value) ? 1 : 0;
    }

    // Simple search, no scoring
    if (!this.#options.enableSearchScoring) {
      // Quoted tokens bypass tokenization and no tokens means column wasn't tokenized.
      if (query.quoted || !tokens) {
        return value.includes(query.value) ? 1 : 0;
      }

      return tokens.some(token => token == query.value) ? 1 : 0;
    }

    // Complex scored search
    // Quoted tokens bypass tokenization and no tokens means column wasn't tokenized.
    if (query.quoted || !tokens) {
      return this.#calculateSearchScore(query.value, value);
    }

    return tokens
      .map(token => this.#calculateSearchScore(query.value, token))
      .reduce((accumulator, score) => (accumulator += score), 0);
  }

  #filterField(
    value: any,
    filter: any,
    filterFunction?: ColumnFilterCallback,
  ): boolean {
    if (Array.isArray(filter)) {
      if (filter.length === 0) {
        return true;
      }
      // If it's an array, we will use an OR filter.
      // If any filters in the array match, keep it.
      return filter.some(element => this.#filterField(value, element));
    }

    if (typeof filterFunction === 'function') {
      return filterFunction(value, filter);
    }

    if (filter instanceof RegExp) {
      return filter.test(String(value));
    }

    return filter === value;
  }

  #filterRow(row: InternalRowData<T>, index: number): boolean {
    if (typeof this.#filters === 'function') {
      return this.#filters(row, index);
    }

    for (const field of Object.keys(this.#filters || {})) {
      if (!(field in this.#filters)) {
        continue;
      }

      const filter = (this.#filters as any)[field];
      const value = this.#getNestedValue(row, field);
      if (typeof filter === 'function') {
        if (!filter(value)) {
          return false;
        }
      } else {
        const col = this.#columnData.get(field);
        const filterCallback = col ? col.filterCallback : undefined;
        if (!this.#filterField(value, filter, filterCallback)) {
          return false;
        }
      }
    }
    return true;
  }

  #filterRows() {
    if (this.#blockUpdates) return;

    const searchableFields = [...this.#columnData.values()]
      .filter(col => col.searchable)
      .map(c => c.field);

    const fields = [...searchableFields, ...this.#options.extraSearchFields];

    const rows = [...this.#rows.values()];
    this.#filteredRows = rows.filter((row, index) => {
      row._metadata.searchScore = 0;
      // Filter takes precedence over search.
      if (!this.#filterRow(row, index)) {
        return false;
      }

      if (!this.#query) {
        return true;
      }

      for (const field of fields) {
        const originalValue = this.#getNestedValue(row, field);
        const compareValue = row._metadata.compareValues[field];
        const columnTokens = row._metadata.tokens[field];

        if (
          typeof originalValue !== 'string' ||
          typeof compareValue !== 'string'
        ) {
          continue;
        }

        let score: number = 0;
        if (this.#query instanceof RegExp) {
          score = this.#searchField(this.#query, originalValue, columnTokens);
        } else {
          for (const token of this.#query) {
            score += this.#searchField(token, compareValue, columnTokens);
          }
        }

        //const score = this.#searchField([...tokens], this.#query);
        row._metadata.searchScore += score;
      }

      return row._metadata.searchScore > 0;
    });

    this.#sortRows();

    const changeEvent = new CustomEvent<
      DataTableEventMap<T>['dt.rows.changed']
    >('dt.rows.changed', {
      cancelable: false,
      detail: {
        dataTable: this,
      },
    });

    this.dispatchEvent(changeEvent);
  }

  #compareRows(
    a: InternalRowData<T>,
    b: InternalRowData<T>,
    col: ColumnOptions<T>,
  ): number {
    let aValue, bValue;
    if (col.sortOrder === 'asc') {
      aValue = a._metadata.sortValues[col.field];
      bValue = b._metadata.sortValues[col.field];
    } else if (col.sortOrder === 'desc') {
      aValue = b._metadata.sortValues[col.field];
      bValue = a._metadata.sortValues[col.field];
    }

    if (typeof col.sorter === 'function') {
      const ret = col.sorter(aValue, bValue);
      if (ret !== 0) return ret;
    }

    const aIsNull = aValue == null;
    const bIsNull = bValue == null;

    if (aIsNull && !bIsNull) return -1;
    if (bIsNull && !aIsNull) return 1;

    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  }

  #sortRows() {
    if (this.#blockUpdates) return;

    const sortedColumns = [...this.#columnData.values()]
      // Only sort by visible columns with valid sort priorities
      .filter(col => !col.headerElement.hidden && col.sortOrder)
      // Sort our columns by their sort priority.
      // This is how sorting by multiple columns is handled.
      .sort((a, b) => a.sortPriority - b.sortPriority);

    this.#filteredRows.sort((a, b) => {
      // Try to sort by search score if we're using scoring and there is a query.
      if (this.#options.enableSearchScoring && this.#query) {
        const aValue = a._metadata.searchScore || 0;
        const bValue = b._metadata.searchScore || 0;
        if (aValue > bValue) return -1;
        if (aValue < bValue) return 1;
      }

      for (const col of sortedColumns) {
        const comp = this.#compareRows(a, b, col);
        if (comp !== 0) {
          return comp;
        }
      }

      // Always fall back to the index column
      return a._metadata.index - b._metadata.index;
    });
    this.#renderTable();
  }

  #updateHeaders() {
    if (this.#blockUpdates) return;

    for (const col of this.#columnData.values()) {
      // Update the order of headers
      col.headerElement.parentElement?.append(col.headerElement);
      col.headerElement.hidden = !col.visible;

      if (col.sortOrder === 'asc') {
        col.headerElement?.classList.add('dt-ascending');
        col.headerElement?.classList.remove('dt-descending');
      } else if (col.sortOrder === 'desc') {
        col.headerElement?.classList.add('dt-descending');
        col.headerElement?.classList.remove('dt-ascending');
      } else {
        col.headerElement?.classList.remove('dt-ascending');
        col.headerElement?.classList.remove('dt-descending');
      }
    }
  }

  #renderTable() {
    if (this.#blockUpdates) return;

    const useVirtualScroll = this.rows.length >= this.#options.virtualScroll;

    if (useVirtualScroll && !this.#virtualScroll) {
      this.#virtualScroll = new this.#options.virtualScrollClass({
        container: this.#scroller,
        element: this.#tbody,
        generator: index => this.#createRow(index),
      });
    } else if (!useVirtualScroll && this.#virtualScroll) {
      this.#virtualScroll.stop();
      this.#virtualScroll = undefined;
    }

    this.#tbody.innerHTML = '';
    if (this.#virtualScroll) {
      try {
        this.#virtualScroll.start(this.#filteredRows.length);
      } catch (error) {
        if (error instanceof VirtualScrollError) {
          console.warn(
            'Failed to start virtual scroll... falling back to standard rendering',
          );
          console.warn(error.stack);
        }
      }
    } else {
      if (this.#filteredRows.length > WARN_ROW_COUNT) {
        const count = WARN_ROW_COUNT.toLocaleString();
        console.warn(
          `Virtual scroll disabled with more than ${count} rows... Good luck with that!`,
        );
      }

      const rowElements = this.#filteredRows.map((_, index) =>
        this.#createRow(index),
      );
      this.#tbody.append(...rowElements);
    }

    if (this.#rows.size === 0) {
      this.showMessage(this.#options.noDataText, 'dt-empty');
    } else if (this.#filteredRows.length === 0) {
      this.showMessage(this.#options.noMatchText, 'dt-empty');
    }
  }

  #markText(element: HTMLElement, query: RegExp) {
    if (element.children.length === 0) {
      let text = element.textContent ?? '';
      const classes = this.#options.classes.mark.join(' ');
      text = text.replace(
        query,
        match => `<mark class="${classes}">${match}</mark>`,
      );
      element.innerHTML = text;
    } else {
      for (const child of element.children) {
        if (child instanceof HTMLElement) {
          this.#markText(child, query);
        }
      }
    }
  }

  #updateCell(
    td: HTMLTableCellElement,
    value: any,
    col: ColumnData<T>,
    row: T,
  ) {
    // Full text on hover
    td.title = String(value);

    if (typeof col.valueFormatter === 'function') {
      value = col.valueFormatter(value, row);
    }
    td.textContent = value == null ? '-' : value;

    if (typeof col.elementFormatter === 'function') {
      col.elementFormatter(value, row, td);
    }

    if (this.#options.highlightSearch && this.#query && col.searchable) {
      let regex: RegExp;
      if (this.#query instanceof RegExp) {
        regex = this.#query;
      } else {
        const tokens = this.#query.map(token => token.value).join('|');
        regex = new RegExp(tokens, 'gi');
      }

      this.#markText(td, regex);
    }

    td.hidden = col.visible ? false : true;
  }

  #createRow(index: number): HTMLTableRowElement {
    const row = this.#filteredRows[index];
    const tr = document.createElement('tr');
    tr.classList.add(...this.#options.classes.tr);
    tr.dataset.dtIndex = String(row._metadata.index);

    for (const [field, col] of this.#columnData) {
      const value = this.#getNestedValue(row, field);
      const td = document.createElement('td');
      td.classList.add(...this.#options.classes.td);
      td.dataset.dtField = field;
      const colWidth = col.headerElement.style.width;
      // If the column has been resized, force the cells to that width.
      if (colWidth && colWidth !== '0px') {
        // We have to set the cells max width to allow text-overflow: ellipsis to work.
        td.style.maxWidth = colWidth;
      }

      this.#updateCell(td, value, col, row);
      tr.append(td);
    }

    if (typeof this.#options.rowFormatter === 'function') {
      try {
        this.#options.rowFormatter(row, tr);
      } catch (error) {
        console.error('Row formatter callback failed with the following error');
        console.error(error);
      }
    }

    return tr;
  }

  #getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key];
      } else {
        return undefined; // Or handle the error as needed
      }
    }

    return current;
  }

  #resizeColumn(column: string | ColumnData<T>, width?: number) {
    if (typeof column === 'string') {
      const columnData = this.#columnData.get(column);
      if (!columnData) throw new Error('Column not found');
      column = columnData;
    }

    let headerWidth, cellWidth;
    if (width == null) {
      headerWidth = '';
      cellWidth = '';
    } else if (width <= 0) {
      headerWidth = '0px';
      cellWidth = '';
    } else {
      headerWidth = `${width}px`;
      cellWidth = `${width}px`;
    }
    const prevWidth = column.headerElement.offsetWidth;
    column.headerElement.style.width = headerWidth;
    column.headerElement.style.maxWidth = headerWidth;

    const cells = this.#tbody.querySelectorAll<HTMLTableCellElement>(
      `td[data-dt-field="${column.field}"]`,
    );
    for (const cell of cells) {
      // If width is 0 it means we want to auto size the columns.
      // To do that we set the width to 0px on the header
      // and clear the max width on all of the cells.
      cell.style.maxWidth = cellWidth;
    }

    // Resize the table based on how much the column changed
    const delta = column.headerElement.offsetWidth - prevWidth;
    const tableWidth = this.#table.offsetWidth + delta;
    this.#table.style.width = `${tableWidth}px`;
  }

  /* Event handlers */

  #onTableClicked = (event: MouseEvent) => {
    // Ignore events if the user is highlighting text
    if (window.getSelection()?.toString()) return;

    let tr, td, field;
    if (event.target instanceof HTMLTableCellElement) {
      td = event.target;
      tr = td.parentElement;
      field = td.dataset.dtField;
    } else if (event.target instanceof HTMLTableRowElement) {
      tr = event.target;
    }

    if (tr) {
      const index = parseInt(tr.dataset.dtIndex || '');
      if (!isNaN(index)) {
        const row = this.#filteredRows.find(
          value => value._metadata.index === index,
        );
        if (row) {
          const rowEvent = new CustomEvent<
            DataTableEventMap<T>['dt.row.clicked']
          >('dt.row.clicked', {
            cancelable: false,
            detail: {
              row: row,
              index: index,
              column: field,
              originalEvent: event,
            },
          });
          this.dispatchEvent(rowEvent);
        }
      }
    }
  };

  #onResizeColumnStart = (event: MouseEvent) => {
    // If target is not the resizer, we don't care.
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.classList.contains('dt-resizer')) return;
    // If the current target isn't the header, we don't care.
    if (!(event.currentTarget instanceof HTMLElement)) return;
    if (!event.currentTarget.dataset.dtField) return;

    event.stopImmediatePropagation();
    event.preventDefault();

    const field = event.currentTarget.dataset.dtField;
    const col = this.#columnData.get(field);
    if (!col) return;
    this.#resizingColumn = col;

    col.resizeStartX = event.clientX;
    col.resizeStartWidth = col.headerElement.offsetWidth;

    document.addEventListener('mousemove', this.#onResizeColumnMove);
    document.addEventListener('mouseup', this.#onResizeColumnEnd);
  };

  #onResizeColumnMove = (event: MouseEvent) => {
    if (!this.#resizingColumn) return;
    event.stopImmediatePropagation();
    event.preventDefault();

    const dx = event.clientX - this.#resizingColumn.resizeStartX!;
    const newWidth = this.#resizingColumn.resizeStartWidth! + dx;
    this.#resizeColumn(this.#resizingColumn, newWidth);
  };

  #onResizeColumnEnd = (event: MouseEvent) => {
    if (!this.#resizingColumn) return;
    event.stopImmediatePropagation();
    event.preventDefault();

    document.removeEventListener('mousemove', this.#onResizeColumnMove);
    document.removeEventListener('mouseup', this.#onResizeColumnEnd);

    const resizeEvent = new CustomEvent<DataTableEventMap<T>['dt.col.resize']>(
      'dt.col.resize',
      {
        cancelable: false,
        detail: {
          column: this.#resizingColumn.field,
          width: this.#resizingColumn.headerElement.offsetWidth,
        },
      },
    );

    this.dispatchEvent(resizeEvent);

    this.#resizingColumn = undefined;
  };

  #onResizeColumnDoubleClick = (event: MouseEvent) => {
    // If target is not the resizer, we don't care.
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.classList.contains('dt-resizer')) return;
    // If the current target isn't the header, we don't care.
    if (!(event.currentTarget instanceof HTMLElement)) return;
    if (!event.currentTarget.dataset.dtField) return;

    const field = event.currentTarget.dataset.dtField;
    if (!field) return;
    this.#resizeColumn(field);
  };

  #onDragColumnStart = (event: DragEvent) => {
    const target = event.target as HTMLElement;
    const field = target.dataset.dtField;

    if (event.dataTransfer && field) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', field);
    }
  };

  #onDragColumnOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    return false;
  };

  #onDragColumnEnter = (event: DragEvent) => {
    const target = event.target as HTMLElement;
    target.classList.add('dt-drag-over');
  };

  #onDragColumnLeave = (event: DragEvent) => {
    const target = event.target as HTMLElement;
    target.classList.remove('dt-drag-over');
  };

  #onDragColumnDrop = (event: DragEvent) => {
    const dragField = event.dataTransfer?.getData('text/plain');
    const target = event.currentTarget as HTMLElement;
    const dropField = target.dataset.dtField;

    if (!dragField || !dropField) return;

    event.preventDefault();
    event.stopPropagation();

    const columns = [...this.#columnData.values()];
    const dragIndex = columns.findIndex(col => col.field === dragField);
    const dropIndex = columns.findIndex(col => col.field === dropField);

    if (dragIndex > -1 && dropIndex > -1) {
      const [draggedColumn] = columns.splice(dragIndex, 1);
      const droppedColumn = this.#columnData.get(dropField);
      if (!droppedColumn) return;

      columns.splice(dropIndex, 0, draggedColumn);
      const newColumnOrder = columns.map(col => col.field);
      const reorderEvent = new CustomEvent<
        DataTableEventMap<T>['dt.col.reorder']
      >('dt.col.reorder', {
        cancelable: true,
        detail: {
          draggedColumn: draggedColumn.field,
          dropColumn: droppedColumn.field,
          order: newColumnOrder,
        },
      });
      if (!this.dispatchEvent(reorderEvent)) {
        return;
      }

      this.setColumnOrder(newColumnOrder);
    }
  };

  #onDragColumnEnd = () => {
    const elements = document.querySelectorAll('.dt-drag-over');
    for (const element of elements) {
      element.classList.remove('dt-drag-over');
    }
  };

  addEventListener<K extends keyof DataTableEventMap<T>>(
    type: K,
    listener: (
      this: DataTable<T>,
      ev: CustomEvent<DataTableEventMap<T>[K]>,
    ) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;

  // This is the generic fallback for any other string event type (e.g., standard DOM events).
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  // The single implementation for both overloads.
  addEventListener(type: any, listener: any, options?: any) {
    super.addEventListener(type, listener, options);
  }
}

type ColumnField<T> = NestedKeyOf<T>;

interface ColumnData<T> {
  field: ColumnField<T>;
  title: string;
  sortable: boolean;
  searchable: boolean;
  tokenize: boolean;
  sortOrder: SortOrder;
  sortPriority: number;
  visible: boolean;
  valueFormatter?: ValueFormatterCallback<T>;
  elementFormatter?: CellFormatterCallback<T>;
  sorterCallback?: ComparatorCallback;
  sortValueCallback?: SortValueCallback;
  filterCallback?: ColumnFilterCallback;

  headerElement: HTMLElement;
  titleElement: HTMLElement;

  resizeStartX: number | null;
  resizeStartWidth: number | null;
}

interface RowMetadata {
  index: number;
  searchScore?: number;
  tokens: Record<string, string[]>;
  compareValues: Record<string, string>;
  sortValues: Record<string, any>;
}

type InternalRowData<T> = T & { _metadata: RowMetadata };

type InternalClasses = Required<{ [K in keyof TableClasses]: string[] }>;

const WARN_ROW_COUNT = 10_000;

/**
 * Defines the mapping between event names and their detail object types.
 */
export interface DataTableEventMap<T> {
  'dt.row.clicked': {
    row: T;
    index: number;
    column: string | undefined;
    originalEvent: MouseEvent;
  };

  'dt.rows.changed': object;

  'dt.col.sort': {
    column: string;
    order: SortOrder;
  };

  'dt.col.visibility': {
    column: string;
    visible: boolean;
  };

  'dt.col.resize': {
    column: string;
    width: number;
  };

  'dt.col.reorder': {
    draggedColumn: string;
    dropColumn: string;
    order: string[];
  };
}

// Table options without data and columns. Omit rowFormatter from required and add it back.
type RequiredOptions<T> = Required<
  Omit<TableOptions<T>, 'columns' | 'data' | 'rowFormatter' | 'classes'>
> &
  Pick<TableOptions<T>, 'rowFormatter'> & {
    classes: InternalClasses;
    virtualScroll: number;
  };

type UpdatableOptions<T> = Pick<
  TableOptions<T>,
  | 'virtualScroll'
  | 'highlightSearch'
  | 'tokenizeSearch'
  | 'enableSearchScoring'
  | 'rearrangeable'
  | 'extraSearchFields'
  | 'noMatchText'
  | 'noDataText'
  | 'classes'
>;

type UpdateableColumnOptions<T> = Pick<
  ColumnOptions<T>,
  | 'title'
  | 'searchable'
  | 'resizable'
  | 'sortable'
  | 'tokenize'
  | 'valueFormatter'
  | 'elementFormatter'
  | 'sorter'
>;

export type * from './types';
export { createRegexTokenizer };
