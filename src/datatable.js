/**
 * Class for creating a DataTable that will add sort, search, filter, and virtual scroll to a table.
 */
export class DataTable {
  /** @type {HTMLElement} */
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
  /** @type {Object[]} */
  #rows;
  /** @type {Object[]} */
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

  /** @type {number} */
  #sortPriority = 0;
  #noDataText;
  #noMatchText;
  /** @type {TableClasses} */
  #classes;
  /** @type {ColumnOptions} */
  #indexCol;

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
  }) {
    table = getElement(table, "table");
    if (!Array.isArray(columns)) {
      throw new TypeError("columns must be a list of columns");
    }

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

    for (const col of columns) {
      if (col.field === "index") {
        this.#indexCol = col;
        break;
      }
    }

    if (!this.#indexCol) {
      this.#indexCol = {
        field: "index",
        title: "Index",
        visible: false,
        sortable: true,
        sortOrder: "asc",
        searchable: false,
      };
    }

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

    if (!colVisible) {
      throw new Error("At least one column must be visible");
    }

    this.#virtualScroll = new VirtualScroll({
      container: this.#scroller,
      element: this.#tbody,
      generator: (index) => this.#createRow(index),
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
    if (Array.isArray(rows) && rows.length > 0) {
      if ("index" in rows[0]) {
        /*
        console.warn(
          "DataTable uses the index property to keep track of the initial sort order but the\n" +
            "provided data already contains an index. Rows will be sorted by the given index"
        );
         */
      } else {
        // Store initial index so we can "unsort" data.
        rows.forEach((element, index) => (element.index = index));
      }

      this.#rows = rows;
      this.#filteredRows = rows;
    } else {
      this.#rows = [];
      this.#filteredRows = [];
    }

    this.#updateHeaders();
    this.#filterRows();
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
    if (query && query !== "") {
      if (typeof query === "string") {
        this.#query = query.toLocaleLowerCase();
      } else if (query instanceof RegExp) {
        this.#query = query;
      } else {
        throw new TypeError("Search query must be string or regex");
      }
    } else {
      this.#query = null;
    }

    this.#filterRows();
  }

  /**
   * @callback filterCallback
   * @param {Object} row - The row to be tested.
   * @param {number} index - Index of the given row.
   * @returns {boolean} True to keep value, false to filter it out.
   */

  /**
   * Apply the given filters to the table.
   * Filters should be an object with keys for any columns
   * to be filtered and values to match against the underlying data.
   * E.g. {quantity: 1} will only show rows where the quantity column = 1
   * Can also be a function that will be called for each row.
   * @param {Object | filterCallback} filters
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
   * If order is none, the columns will be "unsorted" and revert
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
        `Attempting to ${
          visisble ? "show" : "hide"
        } non-existent column ${colName}`
      );
      return;
    }

    col.visible = visisble;
    this.#table
      .querySelectorAll(
        `td[data-dt-field="${colName}"], th[data-dt-field="${colName}"]`
      )
      .forEach((element) => (element.style.display = visisble ? "" : "none"));

    this.#sortRows();

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
              if (typeof col.formatter === "function") {
                value = col.valueFormatter(value);
              }

              if (typeof value === "string") {
                value.replace('"', '""');
                list.push(`"${value}"`);
              }
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
      for (const element of value) {
        if (this.#searchField(element, query)) {
          return true;
        }
      }
      return false;
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
      const value = row[field];
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

    this.#filteredRows = this.#rows.filter((row, index) => {
      // Filter takes precedence over search.
      if (!filter(row, index)) {
        return false;
      }

      if (this.#query) {
        const fields = [...Object.keys(this.#columns), ...this.#extraFields];
        for (const field of fields) {
          const col = this.#getColumn(field);
          // If we can't find the column it probably means that
          // the field came from the extra keys so just search it.
          if (!col || col.searchable) {
            if (this.#searchField(row[field], this.#query)) {
              return true;
            }
          }
        }
        return false;
      }

      return true;
    });
    this.#sortRows();
    this.#updateTable();

    this.#table.dispatchEvent(new DataTableEvent("rows.changed"));
  }

  #sortRows() {
    const sortedColumns = Object.values(this.#columns)
      .filter((col) => col.visible && typeof col.sortPriority === "number")
      .sort((a, b) => {
        const aPriority =
          typeof a.sortPriority === "number" ? a.sortPriority : 0;
        const bPriority =
          typeof b.sortPriority === "number" ? b.sortPriority : 0;
        return aPriority - bPriority;
      });

    // If all other fields are equal, sort by index.
    sortedColumns.push(this.#indexCol);

    this.#filteredRows.sort((a, b) => {
      for (const col of sortedColumns) {
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

        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
      }
      return 0;
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
        this.#tbody.innerHTML = this.#filteredRows
          .map((row, index) => this.#createRow(index))
          .join("\n");
      }
    } else if (this.#rows.length === 0) {
      this.showMessage(this.#noDataText, "dt-empty");
    } else {
      this.showMessage(this.#noMatchText, "dt-empty");
    }
  }

  #createRow(index) {
    const row = this.#filteredRows[index];
    const tr = document.createElement("tr");
    tr.classList.add(...classesToArray(this.#classes.tr));
    tr.dataset.dtIndex = index;

    for (const field in this.#columns) {
      let value = this.#getNestedValue(row, field);
      const col = this.#getColumn(field);
      const td = document.createElement("td");
      td.classList.add(...classesToArray(this.#classes.td));
      td.dataset.dtField = field;
      if (typeof col.valueFormatter === "function") {
        value = col.valueFormatter(value);
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
          "<mark>$&</mark>"
        );
      }

      tr.append(td);

      if (!col.visible) {
        td.style.display = "none";
      }
    }

    if (typeof this.#rowFormatter === "function") {
      this.#rowFormatter(row, tr);
    }

    return tr.outerHTML;
  }

  #getNestedValue(obj, path) {
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
      const visibleChildren = new Array(visibleNodesCount)
        .fill(null)
        .map((_, index) => this.#generator(index + startNode));
      // We create two empty rows. One at the top and one at the bottom.
      // Resize the rows accordingly to move the rendered rows to where we want.
      this.#element.innerHTML = `
        <tr style="height: ${offsetY}px;"></tr>
        ${visibleChildren.join("\n")}
        <tr style="height: ${remainingHeight}px;"></tr>`;
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
    const html = [];
    for (let i = 0; i < renderSize; ++i) {
      html.push(this.#generator(i));
    }
    this.#element.innerHTML = html.join("\n");
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

/**
 *
 * @param {string | Element} element
 * @param {Element | Document}
 */
const getElement = (element, name = "element", parent = document) => {
  if (!element) {
    throw new TypeError(`${name} can't be null`);
  }
  if (typeof element === "string") {
    element = parent.querySelector(element);
    if (!element)
      throw new TypeError(`Failed to find ${name} using selector ${element}`);
  }
  if (!(element instanceof Element)) {
    throw new TypeError(`${name} must be string or HTML element`);
  }
  return element;
};

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

let warned = false;
const WARN_ROW_COUNT = 10_000;

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
 * @property {ValueFormatter} valueFormatter
 * @property {ElementFormatter} elementFormatter
 * @property {function} sorter
 * @property {function} compare
 * @property {Element} element
 * @property {string} sortOrder
 * @property {number} sortPriority
 * @property {boolean} visible
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
 */

/**
 * @callback RowFormatter
 * @param {Object} row
 * @param {HTMLElement} element
 */

/**
 * @callback ValueFormatter
 * @param {any} value
 * @returns {string}
 */

/**
 * @callback ElementFormatter
 * @param {any} value
 * @param {object} row
 * @param {HTMLElement} element
 */
