import './datatable.css';

import { VirtualScroll, VirtualScrollError } from './virtualScroll';
import { classesToArray, toHumanReadable, whitespaceTokenizer } from './utils';
import {
  CellFormatterCallback,
  ColumnFilterCallback,
  ColumnOptions,
  ColumnState,
  ComparatorCallback,
  Filters,
  FilterCallback,
  Row,
  RowFormatterCallback,
  SortOrder,
  SortValueCallback,
  TableClasses,
  TableOptions,
  TokenizerCallback,
  ValueFormatterCallback
} from './types';

/**
 * Class for creating a DataTable that will add sort, search, filter, and virtual scroll to a table.
 */
export class DataTable {

  static Events = {
    ROW_CLICK: "dt.row.click",
    ROWS_CHANGED: "dt.rows.changed",
    COL_HIDE: "dt.col.hide",
    COL_SHOW: "dt.col.show",
    COL_SORT: "dt.col.sort",
    COL_RESIZE: "dt.col.resize",
    COL_REARRANGE: "dt.col.rearrange",
  }

  // Centralized default options for the DataTable.
  // These are the base values used if not overridden by user-provided options.
  private static readonly DEFAULT_OPTIONS: Required<Omit<TableOptions, 'columns' | 'data' | 'rowFormatter'>> = {
    virtualScroll: true,
    highlightSearch: true,
    sortable: true,
    searchable: false,
    tokenize: false,
    resizable: true,
    rearrangeable: true,
    extraSearchFields: [],
    noDataText: "No records found",
    noMatchText: "No matching records found",
    classes: {
      scroller: "dt-scroller",
      thead: "dt-headers",
      tbody: "",
      tfoot: "",
      tr: "",
      th: "",
      td: "",
    },
    tokenizer: whitespaceTokenizer, // Default tokenizer function
  };

  // Table elements
  #table!: HTMLTableElement;
  #thead!: HTMLElement;
  #tbody!: HTMLElement;
  #scroller!: HTMLElement;

  #columnData: { [key: string]: ColumnData } = {};

  // Current data
  #rows: RowData[] = [];
  #filteredRows: RowData[] = [];

  // Search and filter data
  #query!: RegExp | string | null;
  #filters!: Filters | FilterCallback;
  // Search fields that are not columns.
  #extraSearchFields: string[];

  #rowFormatter?: RowFormatterCallback;
  #virtualScroll?: VirtualScroll;
  #highlightSearch: boolean;
  #tokenizer: TokenizerCallback;
  // The current sort priority. Incremented when a column is sorted.
  #sortPriority: number = 0;
  #noDataText: string;
  #noMatchText: string;
  #classes: TableClasses;
  #resizingColumn: ColumnData | null = null;

  /**
   * @param  table - Selector or HTMLElement for the table.
   * @param options - Options for the table.
   */
  constructor(table: string | HTMLTableElement, options: TableOptions = {}) {

    const finalOptions = {
      columns: [],
      data: [],
      ...DataTable.DEFAULT_OPTIONS,
      ...options
    };

    if (typeof table === "string") {
      const tableElement = document.querySelector(table);
      if (!tableElement)
        throw new SyntaxError(`Failed to find table using selector ${table}`);
      this.#table = tableElement as HTMLTableElement;
    } else {
      this.#table = table;
    }

    if (!(this.#table instanceof HTMLTableElement)) {
      throw new TypeError(`Invalid table element type. Must be HTMLTableElement`);
    }

    if (!Array.isArray(finalOptions.columns)) {
      throw new TypeError("columns must be a list of columns");
    }

    this.#tokenizer = finalOptions.tokenizer;

    this.#highlightSearch = finalOptions.highlightSearch;
    this.#extraSearchFields = finalOptions.extraSearchFields;
    this.#noDataText = finalOptions.noDataText;
    this.#noMatchText = finalOptions.noMatchText;
    this.#classes = finalOptions.classes;

    this.#rowFormatter = finalOptions.rowFormatter;

    this.#table.classList.add("data-table");

    // Inner element that handles the virtual scroll.
    this.#scroller = document.createElement("div");
    this.#scroller.classList.add(...classesToArray(this.#classes.scroller));
    this.#scroller.style.overflow = "auto";
    this.#scroller.style.height = "100%";

    // If the user tries to provide a height, we will use that for the scroller.
    if (this.#table.style.height !== "") {
      this.#scroller.style.height = this.#table.style.height;
      this.#table.style.height = "";
    }

    // Add the scroller before the table so when we move the
    // table into the scroller it stays in the same place.
    this.#table.parentElement?.insertBefore(this.#scroller, this.#table);
    this.#scroller.append(this.#table);

    if (this.#table.querySelectorAll("thead").length > 1) {
      console.warn("Multiple theads found in table. Using last one.");
    }

    if (this.#table.querySelectorAll("tbody").length > 1) {
      console.warn("Multiple tbodys found in table. Using first one.");
    }

    // Hopefully there isn't more than one header or body
    // but if there is, use the last header and first body
    // since that seems like it would make the most sense.
    const thead = this.#table.querySelector("thead:last-of-type");
    if (thead) {
      this.#thead = thead as HTMLTableElement;
    } else {
      this.#thead = document.createElement("thead");
      this.#table.insertBefore(this.#thead, this.#table.firstChild);
    }

    this.#thead.classList.add(...classesToArray(this.#classes.thead));

    // Create the row for the thead if there isn't one
    let headerRow = this.#thead.querySelector("tr:last-of-type");
    if (!headerRow) {
      headerRow = document.createElement("tr");
      this.#thead.append(headerRow);
    }

    headerRow.classList.add(...classesToArray(this.#classes.tr));
    // Remove any existing header cells
    // TODO: Add ability to use HTML headers provided by the user.
    headerRow.innerHTML = '';

    const tbody = this.#table.querySelector("tbody:first-of-type");
    // Create the tbody if it doesn't exists
    if (tbody) {
      this.#tbody = tbody as HTMLTableElement;
    } else {
      this.#tbody = document.createElement("tbody");
      this.#table.append(this.#tbody);
    }

    this.#tbody.classList.add(...classesToArray(this.#classes.tbody));

    this.#tbody.addEventListener("click", (event) => {
      let tr, td, field;
      if (event.target instanceof HTMLTableCellElement) {
        td = event.target;
        tr = td.parentElement;
        field = td.dataset.dtField;
      } else if (event.target instanceof HTMLTableRowElement) {
        tr = event.target;
      }

      if (tr) {
        const index = parseInt(tr.dataset.dtIndex || "");
        if (!isNaN(index)) {
          const row = this.#filteredRows[index];

          const event = new CustomEvent(DataTable.Events.ROW_CLICK, {
            detail: {
              row: row,
              index: index,
              field: field,
            },
            bubbles: true,
            cancelable: true,
          });
          tr.dispatchEvent(event);
        }
      }
    });

    let colVisible = false;
    // Initialize columns
    for (const colOptions of finalOptions.columns) {
      const colData: ColumnData = {
        field: colOptions.field,
        title: colOptions.title || toHumanReadable(colOptions.field),
        element: document.createElement("th"),
        visible: colOptions.visible ?? true,
        sortable: colOptions.sortable ?? finalOptions.sortable,
        searchable: colOptions.searchable ?? finalOptions.searchable,
        tokenize: colOptions.tokenize ?? finalOptions.tokenize,
        sortOrder: colOptions.sortOrder ?? null,
        sortPriority: colOptions.sortPriority ?? 0,
        resizeStartWidth: null,
        resizeStartX: null,
        valueFormatter: colOptions.valueFormatter,
        elementFormatter: colOptions.elementFormatter,
        comparatorCallback: colOptions.sorter,
        filterCallback: colOptions.filter,
        sortValueCallback: colOptions.sortValue
      };
      this.#columnData[colOptions.field] = colData;

      const th = colData.element;
      th.classList.add(...classesToArray(this.#classes.th));
      th.dataset.dtField = colOptions.field;

      const nameElement = document.createElement("div");
      nameElement.classList.add("dt-header-name");
      nameElement.innerText = colOptions.title || toHumanReadable(colOptions.field);
      th.innerHTML = '';
      th.append(nameElement);
      th.hidden = !colData.visible;

      headerRow.append(th);

      // We need at least one column visible
      if (colData.visible) {
        colVisible = true;
      }

      if (colData.sortable) {
        th.classList.add("dt-sortable");
        // Add the event listener to the name element
        // to prevent clicking on the resizer from sorting.
        nameElement.addEventListener("click", (event) => {
          const target = event.target as HTMLElement;
          const field = target.closest("th")?.dataset.dtField;
          if (!field) return;
          const col = this.#columnData[field];
          if (!col.sortOrder) {
            this.sort(col.field, "asc");
          } else if (col.sortOrder === "asc") {
            this.sort(col.field, "desc");
          } else if (col.sortOrder) {
            this.sort(col.field, null);
          }
        });
      }

      if (colOptions.resizable ?? finalOptions.resizable) {
        const resizer = document.createElement("div");
        resizer.classList.add("dt-resizer");
        resizer.addEventListener("mousedown", this.#resizeColumnStart);
        resizer.addEventListener("dblclick", this.#resizeColumnDoubleClick);
        th.append(resizer);
      }

      if (typeof colOptions.width === "number") {
        th.style.width = colOptions.width + "px";
      } else if (typeof colOptions.width === "string") {
        th.style.width = colOptions.width;
      }

      if (finalOptions.rearrangeable) {
        th.draggable = true;
        th.addEventListener("dragstart", this.#dragColumnStart);
        th.addEventListener("dragenter", this.#dragColumnEnter);
        th.addEventListener("dragover", this.#dragColumnOver);
        th.addEventListener("dragleave", this.#dragColumnLeave);
        th.addEventListener("drop", this.#dragColumnDrop);
        th.addEventListener("dragend", this.#dragColumnEnd);
      }
    }

    if (Object.keys(this.#columnData).length === 0) {
      console.warn("No columns found. At least one column is required.");
    } else if (!colVisible) {
      console.warn("At least a single column must be visible. Showing the first column.");
      this.showColumn(Object.keys(this.#columnData)[0]);
    }

    this.virtualScroll = finalOptions.virtualScroll;
    this.loadData(finalOptions.data);
  }

  /**
   * Gets a list of the ColumnStates for all columns in the table
   * Can be used to save / restore columns sates.
   */
  get columnStates(): ColumnState[] {
    return Object.values(this.#columnData).map((col) => {
      return {
        field: col.field,
        title: col.title,
        visible: col.visible,
        sortOrder: col.sortOrder,
        sortPriority: col.sortPriority,
        width: col.element.style.width,
      } as ColumnState;
    });
  }

  set columnStates(states: ColumnState[]) {
    for (const state of states) {
      const column = this.#columnData[state.field];
      if (!column) {
        console.warn(`Attempting to restore state for non-existent column ${state.field}`);
        continue;
      }

      column.visible = state.visible ?? column.visible;
      column.sortOrder = state.sortOrder ?? column.sortOrder;
      column.sortPriority = state.sortPriority ?? column.sortPriority;
      column.element.style.width = state.width ?? column.element.style.width;
    }
    this.refresh();
  }

  /**
   * Get the current data in the table.
   */
  get rows() {
    return this.#filteredRows;
  }

  /**
   * Get total row count of visible data.
   */
  get length(): number {
    return this.#filteredRows ? this.#filteredRows.length : 0;
  }

  /**
   * Get the current table element.
   */
  get table(): HTMLTableElement {
    return this.#table;
  }

  /**
   * Get the current virtual scroll setting.
   * If the value is 0, virtual scroll is disabled.
   * If the value is true, virtual scroll is enabled.
   * If the value is a number, it will be used as the row count for virtual scroll.
   */
  get virtualScroll(): boolean {
    return !!this.#virtualScroll;
  }

  set virtualScroll(value) {
    if (value == this.virtualScroll) return;

    if (value) {
      this.#virtualScroll = new VirtualScroll({
        container: this.#scroller,
        element: this.#tbody,
        generator: (index) => this.#createRow(index),
      });
      this.#virtualScroll.start();
    } else {
      this.#virtualScroll?.stop();
      this.#virtualScroll = undefined;
    }

    this.#updateTable();
  }

  /**
   * Loads the given rows into the table.
   * This will overwrite any already existing rows.
   */
  loadData(rows: Row[]) {
    if (Array.isArray(rows) && rows.length > 0) {
      let index = 0;

      this.#rows = rows as RowData[];
      this.#filteredRows = this.#rows;

      for (const row of this.#rows) {
        // Add the index
        const metadata: RowMetadata = {
          index: index++,
          tokens: {},
          sortValues: {}
        };
        row._metadata = metadata;

        for (const field of Object.keys(this.#columnData)) {
          const col = this.#columnData[field];
          const value = this.#getNestedValue(row, field);

          // Cache precomputed values for sorting
          if (typeof col.sortValueCallback === "function") {
            metadata.sortValues[field] = col.sortValueCallback(value);
          } else if (typeof value === "string") {
            metadata.sortValues[field] = value.toLocaleLowerCase();
          } else {
            metadata.sortValues[field] = value;
          }

          // Tokenize any searchable columns
          if (col.searchable && col.tokenize && value) {
            metadata.tokens[field] = [value, ...this.#tokenizer(value)];
          }
        }
      }

    } else {
      this.#rows = [];
      this.#filteredRows = [];
    }

    this.#updateHeaders();
    this.#filterRows();
  }

  /**
   * Shows a message overlay that will cover the table.
   */
  showMessage(text: string, classes: string | string[]) {
    if (Array.isArray(classes)) {
      classes = classes.join(" ");
    } else if (typeof classes !== "string") {
      classes = "";
    }

    const colSpan = Object.keys(this.#columnData).length;
    this.#tbody.innerHTML = `<tr class="${classes}"><td colSpan=${colSpan}>${text}</td></tr>`;
  }

  /**
   * Search the table using the given query.
   * The query can be a string or a regular expression.
   * If the query is an empty string, it will clear the search.
   * @param query
   */
  search(query: string | RegExp) {
    this.#query = query !== "" ? query : null;
    this.#filterRows();
  }

  /**
   * Apply the given filters to the table.
   * Filters should be an object with keys for any columns
   * to be filtered and values to match against the underlying data.
   * E.g. {quantity: 1} will only show rows where the quantity column = 1
   * Can also be a function that will be called for each row.
   * @param filters
   */
  filter(filters: Filters | FilterCallback) {
    if (typeof filters !== "object" && typeof filters !== "function") {
      throw new TypeError("filters must be object or function");
    }
    this.#filters = filters;
    this.#filterRows();
  }

  /**
   * Sort the given column using the given order (asc or desc).
   * If order is none, the columns will be "unsorted" and revert
   * revert back to sorting the by the index ascending.
   * @param colName
   * @param order
   */
  sort(colName: string, order: SortOrder) {
    const col = this.#columnData[colName];
    if (!col) {
      console.warn(`Attempting to sort non-existent column ${colName}`);
      return;
    }

    if (order != col.sortOrder) {
      if (order === "asc" || order === "desc") {
        // If we are changing the sort order of a column
        // keep it's existing priority.
        if (col.sortPriority === Number.MAX_VALUE) {
          col.sortPriority = this.#sortPriority++;
        }
      } else {
        col.sortPriority = Number.MAX_VALUE;
        this.#sortPriority--;
      }
      col.sortOrder = order;
    }

    this.#updateHeaders();
    this.#sortRows();

    const event = new CustomEvent(DataTable.Events.COL_SORT, {
      detail: {
        column: col,
        order: col.sortOrder,
      },
      bubbles: true,
      cancelable: true,
    });

    this.#table.dispatchEvent(event);
  }

  /**
   * Set the visibility of a column.
   * @param colName
   * @param visible
   */
  setColumnVisibility(colName: string, visisble: boolean) {
    const col = this.#columnData[colName];
    if (!col) {
      console.warn(
        `Attempting to ${visisble ? "show" : "hide"
        } non-existent column ${colName}`
      );
      return;
    }

    col.visible = visisble;
    this.#updateHeaders();
    // If we hide a column that has sorting, we need to resort.
    // This will also handle hiding all of the columns elements.
    this.#sortRows();

    const eventName = visisble ? DataTable.Events.COL_SHOW : DataTable.Events.COL_HIDE;
    const event = new CustomEvent(eventName, {
      detail: {
        column: col,
        visible: visisble,
      },
      bubbles: true,
      cancelable: true,
    });

    this.#table.dispatchEvent(event);
  }

  /**
   * Show a column.
   * @param field
   */
  showColumn(field: string) {
    this.setColumnVisibility(field, true);
  }

  /**
   * Hide a column.
   * @param field
   */
  hideColumn(field: string) {
    this.setColumnVisibility(field, false);
  }

  /**
   * Export the current visible table data to a CSV file.
   * @param filename - The name of the file to save.
   * @param all - If true, export all rows. If false, only export the filtered rows.
   */
  export(filename: string, all = false) {
    const rows = all ? this.#rows : this.#filteredRows;
    if (rows.length === 0) {
      return;
    }

    const csvHeaders = Object.keys(rows[0]).filter((value) => {
      if (!(value in this.#columnData)) {
        return false;
      }

      return all ? true : this.#columnData[value].element.hidden === false;
    });

    const csvRows = rows
      .map((row) => {
        const list = [];
        for (const key of Object.keys(row)) {
          let value = row[key];
          if (key in this.#columnData) {
            const col = this.#columnData[key];
            if (all || !col.element.hidden) {
              if (typeof col.valueFormatter === "function") {
                value = col.valueFormatter(value, row);
              }

              value = String(value).replace('"', '""');
              list.push(`"${value}"`);
            }
          }
        }
        return list.join(",");
      })
      .join("\n");

    const csvContent = csvHeaders + "\n" + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8," });
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
  }

  /**
   * Scrolls to the given row index in the table.
   * @param index
   */
  scrollTo(index: number) {
    if (this.#virtualScroll) {
      this.#virtualScroll.scrollTo(index);
    }

    const row = this.#tbody.querySelector(`tr[data-dt-index="${index}"]`);
    if (row) {
      row.scrollIntoView(true);
      const theadHeight = parseFloat(getComputedStyle(this.#thead).height);
      this.#scroller.scrollTop -= theadHeight;
    }
  }

  /**
   * Sets the order of the columns in the table.
   * @param fields 
   */
  setColumnOrder(fields: string[]) {
    if (!Array.isArray(fields)) {
      throw new TypeError("fields must be an array of field names");
    }

    const newColumns = fields.map((field) => this.#columnData[field])
      .filter((col) => col !== null);

    this.#columnData = Object.fromEntries(newColumns.map((col) => [col.field, col]));
    this.refresh();
  }

  refresh() {
    this.#updateHeaders();
    this.#filterRows();
  }

  #searchField(value: any, query: RegExp | string): boolean {
    if (Array.isArray(value)) {
      return value.some((element) => this.#searchField(element, query));
    }

    if (query instanceof RegExp) {
      return query.test(String(value));
    }

    return String(value).toLocaleLowerCase().includes(query);
  }

  #filterField(value: any, filter: any, filterFunction?: ColumnFilterCallback): boolean {
    if (Array.isArray(filter)) {
      // If it's an array, we will use an OR filter.
      // If any filters in the array match, keep it.
      for (const element of filter) {
        if (this.#filterField(value, element)) {
          return true;
        }
      }
      return false;
    }

    if (typeof filterFunction === "function") {
      return filterFunction(value, filter);
    }

    if (filter instanceof RegExp) {
      return filter.test(String(value));
    }

    return filter === value;
  }

  #filterRow(row: RowData, index: number): boolean {
    if (typeof this.#filters === "function") {
      return this.#filters(row, index);
    }

    for (const field of Object.keys(this.#filters || {})) {
      const filter = this.#filters[field];
      const col = this.#columnData[field];
      const filterCallback = col ? col.filterCallback : undefined;
      const value = this.#getNestedValue(row, field);
      if (!this.#filterField(value, filter, filterCallback)) {
        return false;
      }
    }
    return true;
  }

  #filterRows() {
    const filter =
      typeof this.#filters === "function"
        ? this.#filters
        : (row: RowData, index: number) => this.#filterRow(row, index);

    let query: RegExp | string | null = null;
    let queryTokens: string[] | RegExp[] = [];
    if (this.#query instanceof RegExp) {
      query = this.#query;
      queryTokens = [query];
    } else if (typeof this.#query === "string") {
      query = this.#query.toLocaleLowerCase();
      queryTokens = this.#tokenizer(query);
    }

    this.#filteredRows = this.#rows.filter((row, index) => {
      row._metadata.searchScore = 0;
      // Filter takes precedence over search.
      if (!filter(row, index)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableFields = Object.values(this.#columnData)
        .filter((col) => col.searchable)
        .map((c) => c.field);

      const fields = [...searchableFields, ...this.#extraSearchFields];

      for (const field of fields) {
        const col = this.#columnData[field];
        if (col && field in row._metadata.tokens) {
          const fieldTokens = row._metadata.tokens[field];
          for (const token of queryTokens) {
            if (this.#searchField(fieldTokens, token)) {
              if (typeof token === "string") {
                row._metadata.searchScore += token.length;
              } else {
                row._metadata.searchScore++;
              }
            }
          }
        } else {
          const value = this.#getNestedValue(row, field);
          if (this.#searchField(value, query)) {
            if (typeof query === "string") {
              row._metadata.searchScore += query.length;
            } else {
              row._metadata.searchScore++;
            }
          }
        }
      }

      return row._metadata.searchScore > 0;
    });

    this.#sortRows();
    this.#updateTable();

    this.#table.dispatchEvent(new CustomEvent(DataTable.Events.ROWS_CHANGED, {
      bubbles: true,
      cancelable: true,
    }));
  }

  #compareRows(a: RowData, b: RowData, col: ColumnOptions): number {
    let aValue, bValue;
    if (col.sortOrder === "asc") {
      aValue = a._metadata.sortValues[col.field];
      bValue = b._metadata.sortValues[col.field];
    } else if (col.sortOrder === "desc") {
      aValue = b._metadata.sortValues[col.field];
      bValue = a._metadata.sortValues[col.field];
    }

    if (typeof col.sorter === "function") {
      const ret = col.sorter(aValue, bValue);
      if (ret !== 0) return ret;
    }

    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  }

  #sortRows() {
    const sortedColumns = Object.values(this.#columnData)
      // Only sort by visible columns with valid sort priorities
      .filter((col) => !col.element.hidden && col.sortOrder)
      // Sort our columns by their sort priority.
      // This is how sorting by multiple columns is handled.
      .sort((a, b) => a.sortPriority - b.sortPriority);

    this.#filteredRows.sort((a, b) => {
      // Try to sort by search score if there is a query.
      const aValue = a._metadata.searchScore || 0;
      const bValue = b._metadata.searchScore || 0;
      if (aValue > bValue) return -1;
      if (aValue < bValue) return 1;

      for (const col of sortedColumns) {
        const comp = this.#compareRows(a, b, col);
        if (comp !== 0) {
          return comp;
        }
      }

      // Always fall back to the index column
      return a._metadata.index - b._metadata.index;
    });
    this.#updateTable();
  }

  #updateHeaders() {
    for (const field of Object.keys(this.#columnData)) {
      const col = this.#columnData[field];

      // Update the order of headers
      col.element.parentElement?.append(col.element);
      col.element.hidden = !col.visible;

      if (col.element.style.width === "") {
        col.element.style.width = col.element.offsetWidth + "px";
      }

      if (col.sortOrder === "asc") {
        col.element?.classList.add("dt-ascending");
        col.element?.classList.remove("dt-descending");
      } else if (col.sortOrder === "desc") {
        col.element?.classList.add("dt-descending");
        col.element?.classList.remove("dt-ascending");
      } else {
        col.element?.classList.remove("dt-ascending");
        col.element?.classList.remove("dt-descending");
      }
    }

    // The last header should never have a width. This forces it to fill
    // the remaining space in the table. Without this, resizing can feel "jumpy".
    const lastCol = Object.values(this.#columnData).filter((c) => c.visible).slice(-1)[0];
    if (lastCol) {
      lastCol.element.style.width = "";
    }
  }

  #updateTable() {
    this.#tbody.innerHTML = "";
    if (this.#filteredRows.length) {
      if (this.#virtualScroll) {
        try {
          this.#virtualScroll.rowCount = this.#filteredRows.length;
        } catch (error) {
          if (error instanceof VirtualScrollError) {
            console.warn(
              "Failed to start virtual scroll... falling back to standard rendering"
            );
            console.warn(error.stack);
          }
        }
      } else {

        if (this.#filteredRows.length > WARN_ROW_COUNT) {
          const count = WARN_ROW_COUNT.toLocaleString();
          console.warn(
            `Virtual scroll disabled with more than ${count} rows... Good luck with that!`
          );
        }

        const rowElements = this.#filteredRows.map((_, index) => this.#createRow(index));
        this.#tbody.append(...rowElements);
      }
    } else if (this.#rows.length === 0) {
      this.showMessage(this.#noDataText, "dt-empty");
    } else {
      this.showMessage(this.#noMatchText, "dt-empty");
    }
  }

  #updateCell(td: HTMLTableCellElement, value: any, col: ColumnData, row: object) {
    if (typeof col.valueFormatter === "function") {
      value = col.valueFormatter(value, row);
    }
    td.innerText = value == null ? "-" : value;

    if (typeof col.elementFormatter === "function") {
      col.elementFormatter(value, row, td);
    }

    if (
      this.#highlightSearch &&
      this.#query &&
      this.#query != "" &&
      col.searchable
    ) {
      td.innerHTML = td.innerText.replace(
        new RegExp(this.#query, "i"),
        (match) => `<mark>${match}</mark>`
      );
    }

    td.hidden = col.visible ? false : true;
  }

  #createRow(index: number): HTMLTableRowElement {
    const row = this.#filteredRows[index];
    const tr = document.createElement("tr");
    tr.classList.add(...classesToArray(this.#classes.tr));
    tr.dataset.dtIndex = String(index);

    for (const field of Object.keys(this.#columnData)) {
      const value = this.#getNestedValue(row, field);
      const col = this.#columnData[field];
      const td = document.createElement("td");
      td.classList.add(...classesToArray(this.#classes.td));
      td.dataset.dtField = field;
      this.#updateCell(td, value, col, row);
      tr.append(td);
    }

    if (typeof this.#rowFormatter === "function") {
      this.#rowFormatter(row, tr);
    }

    return tr;
  }

  #getNestedValue(obj: any, path: string) {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === "object") {
        current = current[key];
      } else {
        return undefined; // Or handle the error as needed
      }
    }

    return current;
  }

  #resizeColumnStart = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target: HTMLElement = event.target as HTMLElement;
    const header = target.closest("th");
    if (!header) return;

    const field = header.dataset.dtField;
    if (!field) return;

    const col = this.#columnData[field];
    if (!col) return;

    this.#resizingColumn = col;

    col.resizeStartX = event.clientX;
    col.resizeStartWidth = header.offsetWidth;

    document.addEventListener("mousemove", this.#resizeColumnMove);
    document.addEventListener("mouseup", this.#resizeColumnEnd);
  }

  #resizeColumnMove = (event: MouseEvent) => {
    if (!this.#resizingColumn) return;

    event.preventDefault();
    const newWidth = this.#resizingColumn.resizeStartWidth! + (event.clientX - this.#resizingColumn.resizeStartX!);
    this.#resizingColumn.element.style.width = `${newWidth}px`;
  }

  #resizeColumnEnd = () => {
    if (!this.#resizingColumn) return;

    document.removeEventListener("mousemove", this.#resizeColumnMove);
    document.removeEventListener("mouseup", this.#resizeColumnEnd);
    this.#table.dispatchEvent(new CustomEvent(DataTable.Events.COL_RESIZE, {
      detail: {
        column: this.#resizingColumn,
        width: this.#resizingColumn.element.offsetWidth,
      },
      bubbles: true,
      cancelable: true,
    }));
    this.#resizingColumn = null;
  }

  #resizeColumnDoubleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const header = target.closest("th");
    if (header) {
      header.style.width = "0px";
    }
  }

  #dragColumnStart = (event: DragEvent) => {
    const target = event.target as HTMLElement;
    const field = target.dataset.dtField;

    if (event.dataTransfer && field) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", field);
    }
  }

  #dragColumnOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    return false;
  }

  #dragColumnEnter = (event: DragEvent) => {
    const target = event.target as HTMLElement;
    target.classList.add("dt-drag-over");
  }

  #dragColumnLeave = (event: DragEvent) => {
    const target = event.target as HTMLElement;
    target.classList.remove("dt-drag-over");
  }

  #dragColumnDrop = (event: DragEvent) => {
    const dragField = event.dataTransfer?.getData("text/plain");
    const target = event.currentTarget as HTMLElement;
    const dropField = target.dataset.dtField;

    if (!dragField || !dropField) return;

    event.preventDefault();
    event.stopPropagation();

    const columns = Object.values(this.#columnData);
    const dragIndex = columns.findIndex((col) => col.field === dragField);
    const dropIndex = columns.findIndex((col) => col.field === dropField);

    if (dragIndex > -1 && dropIndex > -1) {
      const [draggedColumn] = columns.splice(dragIndex, 1);
      const droppedColumn = this.#columnData[dropField];

      // Force the current last column width to it's current width
      // and remove the width from the new last column.
      // This should force the columns to keep their current widths.
      if (dropIndex === columns.length) {
        droppedColumn.element.style.width = droppedColumn.element.offsetWidth + "px";
        draggedColumn.element.style.width = "";
      }

      columns.splice(dropIndex, 0, draggedColumn);

      // Update the #columns object
      this.#columnData = Object.fromEntries(columns.map((col) => [col.field, col]));
      // Re-render the table
      this.#updateHeaders();
      this.#updateTable();

      this.#table.dispatchEvent(new CustomEvent(DataTable.Events.COL_REARRANGE, {
        detail: {
          draggedColumn: draggedColumn,
          dropColumn: this.#columnData[dropField],
          columns: columns,
        },
        bubbles: true,
        cancelable: true,
      }));
    }
  }

  #dragColumnEnd = () => {
    const elements = document.querySelectorAll(".dt-drag-over");
    for (const element of elements) {
      element.classList.remove("dt-drag-over");
    }
  }
}

interface ColumnData {
  field: string;
  title: string;
  sortable: boolean;
  searchable: boolean;
  tokenize: boolean;
  element: HTMLElement;
  visible: boolean;
  sortOrder: SortOrder;
  sortPriority: number;
  resizeStartX: number | null;
  resizeStartWidth: number | null;
  valueFormatter?: ValueFormatterCallback;
  elementFormatter?: CellFormatterCallback;
  comparatorCallback?: ComparatorCallback;
  filterCallback?: ColumnFilterCallback;
  sortValueCallback?: SortValueCallback;
}

interface RowData extends Row {
  _metadata: RowMetadata;
}

interface RowMetadata {
  index: number;
  searchScore?: number;
  tokens: Record<string, string[]>;
  sortValues: Record<string, any>;
}

const WARN_ROW_COUNT = 10_000;