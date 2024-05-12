/**
 * @typedef {Object} Column
 * @property {string} field
 * @property {string} title
 * @property {boolean} sortable
 * @property {boolean} searchable
 * @property {function} formatter
 * @property {function} sorter
 * @property {function} compare
 * @property {Element} element
 * @property {string} sortOrder
 */

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
  /** @type {HTMLElement} */
  #wrapper;
  /** @type {Object.<string> & Column} */
  #columns = {};
  /** @type {Object[]} */
  #rows;
  /** @type {Object[]} */
  #filteredRows;
  /** @type {Object[]} */
  #query;
  /** @type {Object} */
  #filters;

  /** @type {Set<string>} */
  #sortPriority = new Set();

  /**
   * @param {Object} options
   * @param {Element | string} options.table  - Selector or HTMLElement for the table.
   * @param {Column[]} options.columns        - List of columns to be created. Will be merged with any headers in the DOM that have a matching data-field attribute.
   * @param {Object[]} options.data           - Data to be loaded to the table.
   */
  constructor({ table, columns, data }) {
    table = getElement(table, "table");
    if (!Array.isArray(columns)) {
      throw new TypeError("columns must be a list of columns");
    }

    this.#table = table;
    this.#table.classList.add("data-table");

    // Inner element that handles the virtual scroll.
    this.#scroller = document.createElement("div");
    this.#scroller.classList.add("dt-scroller");

    // Add the wrapper before the table so when we move the
    // table into the wrapper it stays in the same place.
    const parent = table.parentElement;
    this.#wrapper = document.createElement("div");
    this.#wrapper.className = "dt-wrapper";
    parent.insertBefore(this.#wrapper, table);

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

    // Create the row for the thead if there isn't one
    let headerRow = this.#thead.querySelector("tr:last-of-type");
    if (!headerRow) {
      headerRow = document.createElement("tr");
      this.#thead.append(headerRow);
    }

    // We create a new table for the headers to allow the body
    // to scroll but the headers to stay in place.
    const headerTable = document.createElement("table");
    headerTable.className = this.#table.className + " dt-headers";
    headerTable.append(this.#thead);

    // Create the tbody if it doesn't exists
    if (!this.#tbody) {
      this.#tbody = document.createElement("tbody");
      this.#table.append(this.#tbody);
    }

    // Wrapper is a flex column. Add the header table
    // and then the scroll which wraps the body table.
    this.#wrapper.append(headerTable);
    this.#wrapper.append(this.#scroller);

    // Initialize columns from argument
    for (const col of columns) {
      let th = this.#thead.querySelector(`th[data-field="${col.field}"]`);
      if (!th) {
        th = document.createElement("th");
      }

      th.dataset.field = col.field;
      th.innerHTML = col.title;
      col.element = th;
      this.#columns[col.field] = col;
      headerRow.append(th);
    }

    // See if user provided columns in thead.
    for (const th of this.#thead.querySelectorAll("th[data-field]")) {
      const field = th.dataset.field;
      if (!(field in this.#columns)) {
        this.#columns[field] = {
          field: field,
          title: th.innertText,
          element: th,
          sortable: th.dataset.sortable === "true",
          searchable: th.dataset.searchable === "true",
        };
      }
    }

    // Handle sort events
    for (const field in this.#columns) {
      const col = this.#columns[field];
      if (col.sortable) {
        const th = col.element;
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
    }

    this.loadData(data);
  }

  /**
   * Get total row count of visible data.
   * @returns {number}
   */
  get length() {
    return this.#filteredRows ? this.#filteredRows.length : 0;
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
        console.warn(
          "DataTable uses the index property to keep track of the initial sort order but the\n" +
            "provided data already contains an index. Rows will be sorted by the given index"
        );
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

    this.#sortRows();
    this.#updateTable();
  }

  /**
   * Search the table using the given string or regular expression
   * @param {string | RegExp} query
   */
  search(query) {
    this.#query = query;
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
    if (typeof filters === "object") {
      for (const field in filters) {
        if (!(field in this.#columns)) {
          console.warn(`Ignoring filter for unknown column ${field}`);
          delete filters[field];
        }
      }
    } else if (typeof filters !== "function") {
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
    const col = this.#columns[colName];
    if (!col) {
      console.warn(`Attempting to sort non-existent column ${colName}`);
      return;
    }

    col.sortOrder = order;
    if (order === "asc") {
      col.element.classList.add("dt-ascending");
      col.element.classList.remove("dt-descending");
      this.#sortPriority.add(col.field);
    } else if (order === "desc") {
      col.element.classList.add("dt-descending");
      col.element.classList.remove("dt-ascending");
      this.#sortPriority.add(col.field);
    } else {
      col.element.classList.remove("dt-ascending");
      col.element.classList.remove("dt-descending");
      this.#sortPriority.delete(col.field);
    }

    this.#sortRows();
  }

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
    return String(value).includes(query);
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
      const col = this.#columns[field];
      const value = row[field];
      if (!this.#filterField(value, filter, col.compare)) {
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
        for (const field in this.#columns) {
          const col = this.#columns[field];
          if (col.searchable) {
            if (!this.#searchField(row[field], this.#query)) {
              return false;
            }
          }
        }
      }

      return true;
    });
    this.#sortRows();
    this.#updateTable();
  }

  #sortRows() {
    if (this.#sortPriority.size === 0) {
      this.#filteredRows.sort((a, b) => {
        if (a.index < b.index) return -1;
        if (b.index < a.index) return 1;
        return 0;
      });
    } else {
      this.#filteredRows.sort((a, b) => {
        for (const field of this.#sortPriority) {
          const col = this.#columns[field];
          let aValue, bValue;
          if (col.sortOrder === "asc") {
            aValue = a[field];
            bValue = b[field];
          } else if (col.sortOrder === "desc") {
            aValue = b[field];
            bValue = a[field];
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
    }
    this.#updateTable();
  }

  #updateTable() {
    this.#tbody.innerHTML = "";
    if (this.#filteredRows.length) {
      this.scroller = new TableVirtualScroll({
        container: this.#scroller,
        table: this.#table,
        tbody: this.#tbody,
        generator: (row) => this.#createRow(row),
        rows: this.#filteredRows,
      });
    } else {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.innerText = "No entries found...";
      td.colSpan = Object.keys(this.#columns).length;
      tr.append(td);
      this.#tbody.append(tr);
    }

    const scrollbarWidth =
      this.#scroller.offsetWidth - this.#scroller.clientWidth;
    // Fixes issue where headers don't line up with columns when the scrollbar is visible.
    this.#wrapper.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);
  }

  #createRow(index) {
    const row = this.#filteredRows[index];
    const html = [`<tr data-index="${index}">`];
    for (const field in this.#columns) {
      let value = row[field];
      const col = this.#columns[field];
      if (typeof col.formatter === "function") {
        value = col.formatter(value);
      }
      html.push(`<td>${value || "-"}</td>`);
    }
    html.push("</tr>");
    return html.join("");
  }
}

class TableVirtualScroll {
  /**
   *
   * @param {Object} options
   * @param {HTMLElement} options.container
   * @param {HTMLElement} options.table
   * @param {HTMLElement} options.tbody
   * @param {Array<Object>} options.rows
   * @param {function} options.generator
   */
  constructor({ container, table, tbody, generator, rows, nodePadding = 2 }) {
    let animationFrame;

    const renderSize = Math.min(1000, rows.length);

    // Create an average row height by rendering the first N rows.
    const html = [];
    for (let i = 0; i < renderSize; ++i) {
      html.push(generator(i));
    }
    tbody.innerHTML = html.join("\n");
    const rowHeight = tbody.offsetHeight / renderSize;
    const totalContentHeight = rowHeight * rows.length;
    tbody.innerHTML = "";

    let scrollTop = tbody.scrollTop;
    table.style.overflow = "hidden";

    const renderChunk = () => {
      let startNode = Math.floor(scrollTop / rowHeight) - nodePadding;
      startNode = Math.max(0, startNode);

      let visibleNodesCount =
        Math.ceil(container.offsetHeight / rowHeight) + 2 * nodePadding;
      visibleNodesCount = Math.min(rows.length - startNode, visibleNodesCount);

      const offsetY = startNode * rowHeight;
      const remainingHeight =
        totalContentHeight - (offsetY + visibleNodesCount * rowHeight);

      try {
        const visibleChildren = new Array(visibleNodesCount)
          .fill(null)
          .map((_, index) => generator(index + startNode));
        // We create two empty rows. One at the top and one at the bottom.
        // Resize the rows accordingly to move the rendered rows to where we want.
        tbody.innerHTML = `
        <tr style="height: ${offsetY}px;"></tr>
        ${visibleChildren.join("\n")}
        <tr style="height: ${remainingHeight}px;"></tr>`;
      } catch (e) {
        if (e instanceof RangeError) {
          console.log(e);
        }
      }
    };

    container.addEventListener("scroll", (e) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      animationFrame = requestAnimationFrame(() => {
        scrollTop = e.target.scrollTop;
        renderChunk();
      });
    });

    window.addEventListener("resize", () => renderChunk());

    renderChunk();
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
