/**
 * Class for creating a DataTable that will add sort, search, filter, and virtual scroll to a table.
 */
export class DataTable {
  /** @type {HTMLTableElement} */
  #table;
  /** @type {HTMLElement} */
  #thead;
  /** @type {HTMLElement} */
  #tbody;
  /** @type {HTMLElement} */
  #tfoot;
  /** @type {HTMLElement} */
  #scroller;
  /** @type {Object} */
  #columns = {};
  /** @type {Object<string, Object>} */
  #rows;
  /** @type {Object<string, Object>} */
  #filteredRows;
  /** @type {RegExp | string} */
  #query;
  /** @type {Object} */
  #filters;
  /** @type {string[]} */
  #extraFields;
  /** @type {RowFormatter} */
  #rowFormatter;
  /** @type {VirtualScroll} */
  #virtualScroll;
  /** @type {number} */
  #virtualScrollCount;
  /** @type {boolean} */
  #highlightSearch;
  /** @type {TokenizerFunction} */
  #tokenizer = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .trim()
      .split(/\s+/);

  /** @type {number} */
  #sortPriority = 0;
  /** @type {string} */
  #noDataText;
  /** @type {string} */
  #noMatchText;
  /** @type {TableClasses} */
  #classes;
  /** @type {ColumnOptions} */
  #identityCol;
  /** @type {Object.<string, HTMLTableRowElement>} */
  #rowElements = {};

  /**
   * @param {TableOptions} options
   */
  constructor({
    table,
    formatter,
    columns = [],
    data,
    virtualScroll = 1000,
    highlightSearch = true,
    extraSearchFields,
    noDataText,
    noMatchText,
    classes,
    tokenizer,
  }) {
    if (!table) {
      throw new TypeError(`table can't be null`);
    }

    if (typeof table === "string") {
      this.#table = parent.querySelector(table);
      if (!this.#table)
        throw new TypeError(`Failed to find table using selector ${table}`);
    }
    else if (table instanceof HTMLTableElement) {
      this.#table = table;
    }

    if (!(this.#table instanceof HTMLTableElement)) {
      throw new TypeError(`Invalid table element type. Must be HTMLTableElement`);
    }

    if (!Array.isArray(columns)) {
      throw new TypeError("columns must be a list of columns");
    }

    this.#tokenizer = tokenizer || this.#tokenizer;

    this.#highlightSearch = highlightSearch;
    this.#extraFields = extraSearchFields || [];
    this.#noDataText = noDataText || "No records found";
    this.#noMatchText = noMatchText || "No matching records found";
    this.#classes = { ...DEFAULT_CLASSES, ...classes };

    this.#rowFormatter = formatter;
    if (typeof virtualScroll === "number") {
      this.#virtualScrollCount = virtualScroll;
    } else if (virtualScroll) {
      this.#virtualScrollCount = 0;
    } else {
      this.#virtualScrollCount = Number.MAX_VALUE;
    }

    this.#table = table;
    this.#table.classList.add("data-table");

    // Inner element that handles the virtual scroll.
    this.#scroller = document.createElement("div");
    this.#scroller.classList.add(...classesToArray(this.#classes.scroller));

    // Add the scroller before the table so when we move the
    // table into the scroller it stays in the same place.
    table.parentElement.insertBefore(this.#scroller, table);
    this.#scroller.append(this.#table);

    if (this.#table.querySelectorAll("thead").length > 1) {
      console.warn("Multiple theads found in table. Using last one.");
    }

    if (this.#table.querySelectorAll("tbody").length > 1) {
      console.warn("Multiple tbodys found in table. Using last one.");
    }

    // Hopefully there isn't more than one header or body
    // but if there is, use the last header and first body
    // since that seems like it would make the most sense.
    this.#thead = this.#table.querySelector("thead:last-of-type");
    this.#tbody = this.#table.querySelector("tbody:first-of-type");

    // Create the thead if there isn't one
    if (!this.#thead) {
      this.#thead = document.createElement("thead");
      this.#table.insertBefore(this.#thead, this.#tbody);
    }

    this.#thead.classList.add(...classesToArray(this.#classes.thead));

    // Create the row for the thead if there isn't one
    let headerRow = this.#thead.querySelector("tr:last-of-type");
    if (!headerRow) {
      headerRow = document.createElement("tr");
      this.#thead.append(headerRow);
    }

    headerRow.classList.add(...classesToArray(this.#classes.tr));

    // Create the tbody if it doesn't exists
    if (!this.#tbody) {
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
        const index = parseInt(tr.dataset.dtIndex);
        if (!isNaN(index)) {
          const row = this.#filteredRows[index];
          const event = new DataTableRowClickEvent(row, field);
          tr.dispatchEvent(event);
        }
      }
    });

    // Initialize columns from argument
    for (const col of columns) {
      let th = this.#thead.querySelector(`th[data-dt-field="${col.field}"]`);
      if (!th) {
        th = document.createElement("th");
        th.classList.add(...classesToArray(this.#classes.th));
        th.dataset.dtField = col.field;
        th.innerText = col.title;
        headerRow.append(th);
      } else {
        col.title = th.innerText;
      }

      col.element = th;
      col.visible = col.visible === undefined ? true : col.visible;
      this.#columns[col.field] = col;
    }

    // See if user provided columns in thead.
    for (const th of this.#thead.querySelectorAll("th[data-dt-field]")) {
      const field = th.dataset.dtField;
      // Columns passed as argument take precedence.
      if (!(field in this.#columns)) {
        this.#columns[field] = {
          field: field,
          title: th.innerText,
          element: th,
          sortable: th.dataset.sortable === "true",
          searchable: th.dataset.searchable === "true",
          visible: th.dataset.visible !== "false",
        };
      }
    }

    let colVisible = false;
    for (const field in this.#columns) {
      const col = this.#getColumn(field);
      const th = col.element;
      th.innerHTML = `<div>${col.title}</div>`;
      // We need at least one column visible
      if (col.identity) {
        if (!this.#identityCol) {
          this.#identityCol = col;
        }
      }

      if (col.visible) {
        colVisible = true;
      } else {
        th.style.display = "none";
      }

      if (col.sortable) {
        th.classList.add("dt-sortable");
        th.addEventListener("click", () => {
          if (!col.sortOrder) {
            this.sort(field, "asc");
          } else if (col.sortOrder === "asc") {
            this.sort(field, "desc");
          } else if (col.sortOrder) {
            this.sort(field, null);
          }
        });
      }

      // If the caller provided a sort function but not a compare
      // function we can use the sort function for a comparison
      if (!col.compare && typeof col.sorter === "function") {
        col.compare = (a, b) => col.sorter(a, b) != 0;
      }
    }

    const identityColumns = this.columns.filter(c => c.identity);
    if (identityColumns.length > 1) {
      console.warn(`DataTable only supports a single identity column but multiple were provided. Using ${this.#identityCol.name}.`);
    }

    // If no identity was provided, we will use the index
    if (this.#identityCol == null) {
      this.#identityCol = {
        field: INDEX_COL_FIELD
      };
    }

    if (!colVisible) {
      console.warn("At least a single column must be visible. Showing the first column.");
      this.showColumn(this.columns[0].field);
    }

    this.#virtualScroll = new VirtualScroll({
      container: this.#scroller,
      element: this.#tbody,
      generator: (index) => this.#getRowElement(index),
      rows: this.#filteredRows,
    });

    this.loadData(data);
  }

  /** @returns {ColumnOptions[]} */
  get columns() {
    return Object.values(this.#columns);
  }

  get rows() {
    return this.#filteredRows;
  }

  /**
   * Get total row count of visible data.
   * @returns {number}
   */
  get length() {
    return this.#filteredRows ? this.#filteredRows.length : 0;
  }

  /**@returns {HTMLTableElement} */
  get table() {
    return this.#table;
  }

  /**
   * Loads the given rows into the table.
   * This will overwrite any already existing rows.
   *
   * @param {Object[]} rows
   */
  loadData(rows) {
    this.#rows = [];
    this.#filteredRows = [];
    this.#rowElements = {};
    this.updateData(rows);
    this.#updateHeaders();
    this.#filterRows();
  }

  updateData(rows) {
    if (Array.isArray(rows) && rows.length > 0) {
      let index = 0;
      const tokenizedCols = this.columns.filter((c) => c.searchable && c.tokenize);
      for (const row of rows) {
        // Add the index
        row[INDEX_COL_FIELD] = index++;
        // Tokenize any searchable columns
        for (const col of tokenizedCols) {
          const field = col.field;
          const value = this.#getNestedValue(row, field);
          if (value) row[`_${field}_tokens`] = this.#tokenizer(value);
        }

        this.#updateRow(row);
      }

      this.#rows = rows;
      this.#filteredRows = rows;
    }
  }

  showMessage(text, classes) {
    if (Array.isArray(classes)) {
      tr.className = classes.join(" ");
    } else if (typeof classes !== "string") {
      classes = "";
    }

    const colSpan = Object.keys(this.#columns).length;
    this.#tbody.innerHTML = `<tr class="${classes}"><td colSpan=${colSpan}>${text}</td></tr>`;
  }

  /**
   * Search the table using the given string or regular expression
   * @param {string | RegExp} query
   */
  search(query) {
    this.#query = query !== "" ? query : null;
    this.#filterRows();
  }

  /**
   * Apply the given filters to the table.
   * Filters should be an object with keys for any columns
   * to be filtered and values to match against the underlying data.
   * E.g. {quantity: 1} will only show rows where the quantity column = 1
   * Can also be a function that will be called for each row.
   * @param {Object | FilterCallback} filters
   */
  filter(filters) {
    if (typeof filters !== "object" && typeof filters !== "function") {
      throw new TypeError("filters must be object or function");
    }
    this.#filters = filters;
    this.#filterRows();
  }

  /**
   * Sort the given column using the given order (asc or desc).
   * If order is null, the columns will be "unsorted" and
   * revert back to sorting the by the index ascending.
   * @param {string} colName
   * @param {string} order
   */
  sort(colName, order) {
    const col = this.#getColumn(colName);
    if (!col) {
      console.warn(`Attempting to sort non-existent column ${colName}`);
      return;
    }

    if (order != col.sortOrder) {
      if (order === "asc" || order === "desc") {
        col.sortPriority = this.#sortPriority++;
      } else {
        col.sortPriority = null;
        this.#sortPriority--;
      }
      col.sortOrder = order;
    }

    this.#updateHeaders();
    this.#sortRows();
    this.#table.dispatchEvent(new DataTableColEvent("sort", col));
  }

  setColumnVisibility(colName, visisble) {
    const col = this.#getColumn(colName);
    if (!col) {
      console.warn(
        `Attempting to ${visisble ? "show" : "hide"
        } non-existent column ${colName}`
      );
      return;
    }

    const selector = `th[data-dt-field="${colName}"], td[data-dt-field="${colName}"]`;

    col.visible = visisble;
    const cells = [];
    cells.push(...this.#table.querySelectorAll(selector));
    Object.values(this.#rowElements).forEach((row) => cells.push(...row.querySelectorAll(selector)));

    cells.forEach((element) => (element.style.display = visisble ? "" : "none"));

    // This causes the table to jump back to the top when a column is hidden / shown.
    //this.#sortRows();

    this.#table.dispatchEvent(
      new DataTableColEvent(visisble ? "show" : "hide", col)
    );
  }

  showColumn(colName) {
    this.setColumnVisibility(colName, true);
  }

  hideColumn(colName) {
    this.setColumnVisibility(colName, false);
  }

  export(name, all = false) {
    const rows = all ? this.#rows : this.#filteredRows;
    if (rows.length === 0) {
      return;
    }

    const csvHeaders = Object.keys(rows[0]).filter((value) => {
      if (!(value in this.#columns)) {
        return false;
      }

      return all ? true : this.#columns[value].visible;
    });

    const csvRows = rows
      .map((row) => {
        const list = [];
        for (let [key, value] of Object.entries(row)) {
          if (key in this.#columns) {
            const col = this.#getColumn(key);
            if (all || col.visible) {
              if (typeof col.valueFormatter === "function") {
                value = col.valueFormatter(value, row);
              }

              if (typeof value !== "string") {
                value = value.toString();
              }

              value.replace('"', '""');
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
    a.download = `${name}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
  }

  scrollTo(index) {
    if (this.#virtualScroll.started) {
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
   *
   * @param {any} value
   * @param {RegExp | string} query
   * @returns
   */
  #searchField(value, query) {
    if (Array.isArray(value)) {
      return value.some((element) => this.#searchField(element, query));
    }

    if (query instanceof RegExp) {
      return query.test(String(value));
    }

    return String(value).toLocaleLowerCase().includes(query);
  }

  #filterField(value, filter, compareFunction) {
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

    if (typeof compareFunction === "function") {
      return compareFunction(value, filter);
    }

    if (filter instanceof RegExp) {
      return filter.test(String(value));
    }

    return filter === value;
  }

  #filterRow(row, index) {
    for (const field in this.#filters) {
      const filter = this.#filters[field];
      const col = this.#getColumn(field);
      const compare = col ? col.compare : null;
      const value = this.#getNestedValue(row, field);
      if (!this.#filterField(value, filter, compare)) {
        return false;
      }
    }
    return true;
  }

  #filterRows() {
    const filter =
      typeof this.#filters === "function"
        ? this.#filters
        : (row, index) => this.#filterRow(row, index);

    let query, queryTokens;
    if (this.#query instanceof RegExp) {
      query = this.#query;
      queryTokens = [query];
    } else if (typeof this.#query === "string") {
      query = this.#query.toLocaleLowerCase();
      queryTokens = this.#tokenizer(query);
    }

    this.#filteredRows = this.#rows.filter((row, index) => {
      row._searchScore = 0;
      // Filter takes precedence over search.
      if (!filter(row, index)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableFields = this.columns
        .filter((col) => col.searchable)
        .map((c) => c.field);

      const fields = [...searchableFields, ...this.#extraFields];

      for (const field of fields) {
        const col = this.#getColumn(field);
        if (col && col.tokenize) {
          const fieldTokens = row[`_${field}_tokens`] || [];
          for (const token of queryTokens) {
            if (this.#searchField(fieldTokens, token)) {
              if (typeof token === "string") {
                row._searchScore += token.length;
              } else {
                row.searchScore++;
              }
            }
          }
        } else {
          const value = this.#getNestedValue(row, field);
          if (this.#searchField(value, query)) {
            if (typeof query === "string") {
              row._searchScore += query.length;
            } else {
              row._searchScore++;
            }
          }
        }
      }

      return row._searchScore > 0;
    });

    this.#sortRows();
    this.#updateTable();

    this.#table.dispatchEvent(new DataTableEvent("rows.changed"));
  }

  /**
   *
   * @param {object} a
   * @param {object} b
   * @param {ColumnOptions} col
   * @returns {number}
   */
  #compareRows(a, b, col) {
    let aValue, bValue;
    if (col.sortOrder === "asc") {
      aValue = this.#getNestedValue(a, col.field);
      bValue = this.#getNestedValue(b, col.field);
    } else if (col.sortOrder === "desc") {
      aValue = this.#getNestedValue(b, col.field);
      bValue = this.#getNestedValue(a, col.field);
    }

    if (typeof col.sorter === "function") {
      const ret = col.sorter(aValue, bValue);
      if (ret !== 0) return ret;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue, "en", { sensitivity: "base" });
    }

    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  }

  #sortRows() {
    const sortedColumns = Object.values(this.#columns)
      // Only sort by visible columns with valid sort priorities
      .filter((col) => col.visible && typeof col.sortPriority === "number")
      // Sort our columns by their sort priority.
      // This is how sorting by multiple columns is handled.
      .sort((a, b) => {
        const aPriority =
          typeof a.sortPriority === "number" ? a.sortPriority : 0;
        const bPriority =
          typeof b.sortPriority === "number" ? b.sortPriority : 0;
        return aPriority - bPriority;
      });

    this.#filteredRows.sort((a, b) => {
      // Try to sort by search score if there is a query.
      let aValue = a._searchScore || 0;
      let bValue = b._searchScore || 0;
      if (aValue > bValue) return -1;
      if (aValue < bValue) return 1;

      for (const col of sortedColumns) {
        const comp = this.#compareRows(a, b, col);
        if (comp !== 0) {
          return comp;
        }
      }
      // Always fall back to the index column
      return a[INDEX_COL_FIELD] - b[INDEX_COL_FIELD];
    });
    this.#updateTable();
  }

  #updateHeaders() {
    for (const field in this.#columns) {
      const col = this.#getColumn(field);
      if (col.sortOrder === "asc") {
        col.element.classList.add("dt-ascending");
        col.element.classList.remove("dt-descending");
      } else if (col.sortOrder === "desc") {
        col.element.classList.add("dt-descending");
        col.element.classList.remove("dt-ascending");
      } else {
        col.element.classList.remove("dt-ascending");
        col.element.classList.remove("dt-descending");
      }
    }
  }

  #getRowElement(index) {
    const row = this.#filteredRows[index];
    const identity = this.#getNestedValue(row, this.#identityCol.field);
    let element = this.#rowElements[identity];
    if (element == null) element = this.#createRowElement(row);
    return element;
  }

  #updateTable() {
    this.#tbody.innerHTML = "";
    if (this.#filteredRows.length) {
      let virtualScroll = false;
      if (this.#filteredRows.length >= this.#virtualScrollCount) {
        try {
          this.#virtualScroll.rowCount = this.#filteredRows.length;
          this.#virtualScroll.start();
          virtualScroll = true;
        } catch (error) {
          if (error instanceof VirtualScrollError) {
            console.warn(
              "Failed to start virtual scroll... falling back to standard rendering"
            );
            console.warn(error.stack);
          }
        }
      }

      if (!virtualScroll) {
        if (!warned && this.#filteredRows.length > WARN_ROW_COUNT) {
          warned = true;
          const count = WARN_ROW_COUNT.toLocaleString();
          console.warn(
            `Virtual scroll disabled with more than ${count} rows... Good luck with that!`
          );
        }

        if (this.#virtualScroll) {
          this.#virtualScroll.stop();
        }

        const rowElements = this.#filteredRows.map((_, index) =>
          this.#getRowElement(index)
        );
        this.#tbody.append(...rowElements);
      }
    } else if (this.#rows.length === 0) {
      this.showMessage(this.#noDataText, "dt-empty");
    } else {
      this.showMessage(this.#noMatchText, "dt-empty");
    }
  }

  /**
   * 
   * @param {HTMLTableCellElement} td 
   * @param {any} value 
   * @param {ColumnOptions} col 
   * @param {object} row 
   */
  #updateCell(td, value, col, row) {
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
  }

  /**
   *
   * @param {number} index
   * @returns {HTMLTableRowElement}
   */
  #createRowElement(row) {
    const tr = document.createElement("tr");
    tr.classList.add(...classesToArray(this.#classes.tr));
    tr.dataset.dtIndex = row[INDEX_COL_FIELD];

    for (const field in this.#columns) {
      let value = this.#getNestedValue(row, field);
      const col = this.#getColumn(field);
      const td = document.createElement("td");
      td.classList.add(...classesToArray(this.#classes.td));
      td.dataset.dtField = field;
      this.#updateCell(td, value, col, row);
      tr.append(td);

      if (!col.visible) {
        td.style.display = "none";
      }
    }

    if (typeof this.#rowFormatter === "function") {
      this.#rowFormatter(row, tr);
    }

    const identity = this.#getNestedValue(row, this.#identityCol.field);
    if (identity != null) {
      this.#rowElements[identity] = tr;
    }

    return tr;
  }

  #updateRow(row) {
    const identity = this.#getNestedValue(row, this.#identityCol.field);
    const tr = this.#rowElements[identity];
    if (!tr) {
      return;
    }
    
    for (let i = 0; i < tr.cells.length; i++) {
      const td = tr.cells[i];
      const field = td.dataset.dtField;
      const value = this.#getNestedValue(row, field);
      const col = this.#getColumn(field);
      this.#updateCell(td, value, col, row);
    }

    if (typeof this.#rowFormatter === "function") {
      this.#rowFormatter(row, tr);
    }
    return tr;
  }

  #getNestedValue(obj, path) {
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

  /**
   * Just a convenience function that helps with type hints
   * @param {string} field
   * @returns {ColumnOptions}
   */
  #getColumn(field) {
    return this.#columns[field];
  }
}

class VirtualScroll {
  #container;
  #element;
  #generator;
  #rowCount = 0;
  #rowHeight = 0;
  #padding = 2;
  #animationFrame;
  #started = false;
  #scrollTop = 0;

  /**
   *
   * @param {Object} options
   * @param {HTMLElement} options.container
   * @param {HTMLElement} options.element
   * @param {Array<Object>} options.rows
   * @param {function} options.generator
   */
  constructor({ container, element, generator, nodePadding = 2 }) {
    this.#container = container;
    this.#element = element;
    this.#generator = generator;
    this.#padding = nodePadding;
  }

  get rowCount() {
    return this.#rowCount;
  }

  set rowCount(count) {
    this.#rowCount = count;
    this.#renderChunk();
  }

  get rowHeight() {
    if (!this.#rowHeight) {
      this.#updateRowHeight();
    }
    return this.#rowHeight;
  }

  get started() {
    return this.#started;
  }

  scrollTo(index) {
    this.#container.scrollTop = this.rowHeight * index;
    this.#renderChunk();
  }

  #scrollCallback = () => {
    // Only update if we are vertically scrolling.
    // Fixes horizontal scroll bug.
    if (this.#container.scrollTop !== this.#scrollTop) {
      this.#scrollTop = this.#container.scrollTop;
      if (this.#animationFrame) {
        cancelAnimationFrame(this.#animationFrame);
      }
      this.#animationFrame = requestAnimationFrame(() => this.#renderChunk());
    }
  };

  #renderCallback = () => {
    this.#renderChunk();
  };

  start() {
    if (this.#started) return;
    this.#started = true;

    this.#container.addEventListener("scroll", this.#scrollCallback);
    window.addEventListener("resize", this.#renderCallback);

    this.#renderChunk();
  }

  stop() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
    }

    this.#container.removeEventListener("scroll", this.#scrollCallback);
    window.removeEventListener("resize", this.#renderCallback);
    this.#started = false;
  }

  #renderChunk() {
    const scrollTop = this.#container.scrollTop;
    const rowCount = this.rowCount;
    const rowHeight = this.rowHeight;
    const padding = this.#padding;
    const totalContentHeight = rowHeight * rowCount;
    // Max out the element height so we can get a real height of the container.
    // This fixes an issue when the parent isn't set to grow causing only a
    // small number of rows to render until you scroll.
    this.#element.innerHTML = `<tr style="height: ${totalContentHeight}px;"></tr>`;
    const viewHeight = this.#container.offsetHeight;

    if (!rowCount || !rowHeight) {
      return;
    }

    let startNode = Math.floor(scrollTop / rowHeight) - padding;
    startNode = Math.max(0, startNode);

    let visibleNodesCount = Math.ceil(viewHeight / rowHeight) + 2 * padding;
    visibleNodesCount = Math.min(rowCount - startNode, visibleNodesCount);

    const offsetY = startNode * rowHeight;
    const remainingHeight =
      totalContentHeight - (offsetY + visibleNodesCount * rowHeight);

    try {
      this.#element.innerHTML = "";
      const visibleChildren = new Array(visibleNodesCount)
        .fill(null)
        .map((_, index) => this.#generator(index + startNode));
      // We create two empty rows. One at the top and one at the bottom.
      // Resize the rows accordingly to move the rendered rows to where we want.
      let topRow = document.createElement("tr");
      let bottomRow = document.createElement("tr");
      topRow.style.height = offsetY + "px";
      bottomRow.style.height = remainingHeight + "px";
      this.#element.append(topRow);
      this.#element.append(...visibleChildren);
      this.#element.append(bottomRow);
    } catch (e) {
      if (e instanceof RangeError) {
        console.log(e);
      }
    }
  }

  #updateRowHeight() {
    if (this.#rowCount === 0) {
      this.#rowHeight = 0;
      return;
    }

    const renderSize = Math.min(1000, this.#rowCount);
    // Create an average row height by rendering the first N rows.
    const elements = [];
    for (let i = 0; i < renderSize; ++i) {
      elements.push(this.#generator(i));
    }
    this.#element.innerHTML = "";
    this.#element.append(...elements);
    this.#rowHeight = this.#element.offsetHeight / renderSize;

    if (this.#rowHeight <= 0) {
      throw new VirtualScrollError(
        "First 1000 rows had no rendered height. Virtual scroll can't be used."
      );
    } else if (this.#rowHeight * this.#rowCount > 33554400) {
      // This seems to be Chrome's max height of an element based on some random testing.
      console.warn(
        "Virtual scroll height exceeded maximum known element height."
      );
    }
  }
}

export class DataTableEvent extends Event {
  constructor(type) {
    super(`dt.${type}`, { bubbles: true });
  }
}

export class DataTableColEvent extends DataTableEvent {
  constructor(type, col) {
    super(`col.${type}`);
    this.col = col;
  }
}

export class DataTableRowEvent extends DataTableEvent {
  constructor(type, row) {
    super(`row.${type}`);
    this.row = row;
  }
}

export class DataTableRowClickEvent extends DataTableRowEvent {
  constructor(row, field) {
    super("click", row);
    this.field = field;
  }
}

class VirtualScrollError extends Error {
  constructor(message) {
    super(message);
  }
}

const classesToArray = (classes) => {
  if (typeof classes === "string") {
    return classes.split(" ");
  } else if (Array.isArray(classes)) {
    return classes;
  } else if (classes == null) {
    return [];
  }
  throw new TypeError("classes must be string or array of strings");
};

// Simple flag to know if the caller has been warned about
// disabling virtual scroll with large data sets.
let warned = false;
// Max number of rows before warning the user.
const WARN_ROW_COUNT = 10_000;
// Field to store the index in
const INDEX_COL_FIELD = "dt_index";

/** @type {TableClasses} */
const DEFAULT_CLASSES = {
  scroller: "dt-scroller",
  thead: "dt-headers",
};

/**
 * @typedef {Object} ColumnOptions
 * @property {string} field
 * @property {string} title
 * @property {boolean} sortable
 * @property {boolean} searchable
 * @property {boolean} tokenize
 * @property {ValueFormatter} valueFormatter
 * @property {ElementFormatter} elementFormatter
 * @property {function} sorter
 * @property {function} compare
 * @property {Element} element
 * @property {string} sortOrder
 * @property {number} sortPriority
 * @property {boolean} visible
 * @property {boolean} identity
 */

/**
 * @typedef {Object} TableClasses
 * @property {string | string[]} scroller
 * @property {string | string[]} thead
 * @property {string | string[]} tbody
 * @property {string | string[]} tfoot
 * @property {string | string[]} tr
 * @property {string | string[]} th
 * @property {string | string[]} td
 */

/**
 * @typedef {Object} TableOptions
 * @property {Element | string} table             - Selector or HTMLElement for the table.
 * @property {RowFormatter} formatter             - Callback used to apply any custom formatting to a row.
 * @property {ColumnOptions[]} columns            - List of columns to be created. Will be merged with any headers in the DOM that have a matching data-field attribute.
 * @property {Object[]} data                      - Data to be loaded to the table.
 * @property {boolean | number} virtualScroll     - Automatically enables virtual scroll for the given number of rows.
 *                                                  If boolean, completely enables or disables it. Defaults to 1000.
 * @property {boolean} highlightSearch            - If true, search results will be wrapped in a mark tag.
 * @property {string[]} extraSearchFields         - Extra fields in the row to be searched. Used for data that doesn't have a column.
 * @property {string} noDataText                  - Text to display if the provided data is empty.
 * @property {string} noMatchText                 - Text to display if search / filter result is empty.
 * @property {TableClasses} classes               - Classes to be applied to created elements.
 * @property {TokenizerFunction} tokenizer        - Function used to tokenize queries and field values.
 */

/**
 * @callback RowFormatter
 * @param {Object} row
 * @param {HTMLElement} element
 */

/**
 * @callback ValueFormatter
 * @param {any} value
 * @param {Object} row
 * @returns {string}
 */

/**
 * @callback ElementFormatter
 * @param {any} value
 * @param {object} row
 * @param {HTMLElement} element
 */

/**
 * @callback TokenizerFunction
 * @param {object} value
 * @returns {string[]}
 */

/**
 * @callback FilterCallback
 * @param {Object} row - The row to be tested.
 * @param {number} index - Index of the given row.
 * @returns {boolean} True to keep value, false to filter it out.
 */
