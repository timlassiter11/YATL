(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.yatl = {}));
})(this, (function (exports) { 'use strict';

  /**
   * Class for creating a DataTable that will add sort, search, filter, and virtual scroll to a table.
   */
  class DataTable {

    static Events = {
      ROW_CLICK: "dt.row.click",
      ROWS_CHANGED: "dt.rows.changed",
      COL_HIDE: "dt.col.hide",
      COL_SHOW: "dt.col.show",
      COL_SORT: "dt.col.sort",
      COL_RESIZE: "dt.col.resize",
      COL_REARRANGE: "dt.col.rearrange",
    }

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
    /** @type {object<string, ColumnOptions>} */
    #columns = {};
    /** @type {object[]} */
    #rows = [];
    /** @type {object[]} */
    #filteredRows = [];
    /** @type {RegExp | string} */
    #query;
    /** @type {object} */
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
    #resizingColumn = null;

    /**
     * @param {string | HTMLTableElement} table - Selector or HTMLElement for the table.
     * @param {TableOptions} options
     */
    constructor(table, {
      formatter,
      columns = [],
      data,
      virtualScroll = 1000,
      highlightSearch = true,
      resizeable = true,
      rearrangeable = false,
      extraSearchFields,
      noDataText,
      noMatchText,
      classes,
      tokenizer,
    } = {}) {
      if (typeof table === "string") {
        this.#table = document.querySelector(table);
        if (!this.#table)
          throw new SyntaxError(`Failed to find table using selector ${table}`);
      } else {
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
      this.#table.parentElement.insertBefore(this.#scroller, this.#table);
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
      for (const field of Object.keys(this.#columns)) {
        const col = this.#getColumn(field);

        if (!col.title) {
          col.title = toHumanReadable(field);
        }

        const th = col.element;
        const nameElement = document.createElement("div");
        nameElement.classList.add("dt-header-name");
        nameElement.innerText = col.title;
        th.innerHTML = '';
        th.append(nameElement);

        // We need at least one column visible
        if (col.visible) {
          colVisible = true;
        } else {
          th.style.display = "none";
        }

        if (col.sortable) {
          th.classList.add("dt-sortable");
          // Add the event listener to the name element
          // to prevent clicking on the resizer from sorting.
          nameElement.addEventListener("click", () => {
            if (!col.sortOrder) {
              this.sort(field, "asc");
            } else if (col.sortOrder === "asc") {
              this.sort(field, "desc");
            } else if (col.sortOrder) {
              this.sort(field, null);
            }
          });
        }

        if (resizeable) {
          const resizer = document.createElement("div");
          resizer.classList.add("dt-resizer");
          resizer.addEventListener("mousedown", this.#resizeColumnStart);
          resizer.addEventListener("dblclick", this.#resizeColumnDoubleClick);
          th.append(resizer);
        }

        if (rearrangeable) {
          th.draggable = true;
          th.addEventListener("dragstart", this.#dragColumnStart);
          th.addEventListener("dragenter", this.#dragColumnEnter);
          th.addEventListener("dragover", this.#dragColumnOver);
          th.addEventListener("dragleave", this.#dragColumnLeave);
          th.addEventListener("drop", this.#dragColumnDrop);
          th.addEventListener("dragend", this.#dragColumnEnd);
        }
      }

      if (this.#columns.length === 0) {
        console.warn("No columns found. At least one column is required.");
      } else if (!colVisible) {
        console.warn("At least a single column must be visible. Showing the first column.");
        this.showColumn(this.columns[0].field);
      }

      this.#virtualScroll = new VirtualScroll({
        container: this.#scroller,
        element: this.#tbody,
        generator: (index) => this.#createRow(index),
        rows: this.#filteredRows,
      });

      this.virtualScroll = virtualScroll;
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

    /** @returns {number | boolean} */
    get virtualScroll() {
      if (this.#virtualScrollCount === Number.MAX_VALUE) {
        return true;
      } else if (this.#virtualScrollCount === 0) {
        return false;
      }
      return this.#virtualScrollCount;
    }

    set virtualScroll(value) {
      if (typeof value === "number") {
        this.#virtualScrollCount = value;
      } else if (value) {
        this.#virtualScrollCount = 0;
      } else {
        this.#virtualScrollCount = Number.MAX_VALUE;
      }
      this.#updateTable();
    }

    /**
     * Get the current virtual scroll status.
     * @returns {boolean}
     */
    get virtualScrollStatus() {
      return this.#virtualScroll.started;
    }

    /**
     * Loads the given rows into the table.
     * This will overwrite any already existing rows.
     *
     * @param {object[]} rows
     */
    loadData(rows) {
      if (Array.isArray(rows) && rows.length > 0) {
        let index = 0;

        for (const originalRow of rows) {
          // Add the index
          originalRow[INDEX_COL_FIELD] = index++;
          for (const col of this.columns) {
            const field = col.field;
            const value = this.#getNestedValue(originalRow, field);

            // Cache precomputed values for sorting
            if (typeof col.sortValue === "function") {
              originalRow[`_${field}_sort`] = col.sortValue(value, originalRow);
            } else if (typeof value === "string") {
              originalRow[`_${field}_sort`] = value.toLocaleLowerCase();
            } else {
              originalRow[`_${field}_sort`] = value;
            }

            // Tokenize any searchable columns
            if (col.searchable && col.tokenize && value) {
              originalRow[`_${field}_tokens`] = this.#tokenizer(value);
            }
          }
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
      this.#query = query !== "" ? query : null;
      this.#filterRows();
    }

    /**
     * Apply the given filters to the table.
     * Filters should be an object with keys for any columns
     * to be filtered and values to match against the underlying data.
     * E.g. {quantity: 1} will only show rows where the quantity column = 1
     * Can also be a function that will be called for each row.
     * @param {object | FilterRowCallback} filters
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

    setColumnVisibility(colName, visisble) {
      const col = this.#getColumn(colName);
      if (!col) {
        console.warn(
          `Attempting to ${visisble ? "show" : "hide"
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

    /**
     * 
     * @param {any} value 
     * @param {any} filter 
     * @param {FilterValueCallback} filterFunction 
     * @returns {boolean}
     */
    #filterField(value, filter, filterFunction) {
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

    #filterRow(row, index) {
      for (const field of Object.keys(this.#filters || {})) {
        const filter = this.#filters[field];
        const col = this.#getColumn(field);
        const filterCallback = col ? col.filter : null;
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

      this.#table.dispatchEvent(new CustomEvent(DataTable.Events.ROWS_CHANGED, {
        bubbles: true,
        cancelable: true,
      }));
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
        aValue = a[`_${col.field}_sort`];
        bValue = b[`_${col.field}_sort`];
      } else if (col.sortOrder === "desc") {
        aValue = b[`_${col.field}_sort`];
        bValue = a[`_${col.field}_sort`];
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
      for (const field of Object.keys(this.#columns)) {
        const col = this.#getColumn(field);

        col.element.parentElement.append(col.element);

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
          const rowElements = this.#filteredRows.map((_, index) => this.#createRow(index));
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

      td.style.display = col.visible ? "" : "none";
    }

    /**
     *
     * @param {number} index
     * @returns {HTMLTableRowElement}
     */
    #createRow(index) {
      const row = this.#filteredRows[index];
      const tr = document.createElement("tr");
      tr.classList.add(...classesToArray(this.#classes.tr));
      tr.dataset.dtIndex = index;

      for (const field of Object.keys(this.#columns)) {
        let value = this.#getNestedValue(row, field);
        const col = this.#getColumn(field);
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

    #resizeColumnStart = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const header = event.target.closest("th");
      if (!header) return;

      const field = header.dataset.dtField;
      const col = this.#getColumn(field);
      if (!col) return;

      this.#resizingColumn = col;

      col.startX = event.clientX;
      col.startWidth = header.offsetWidth;

      document.addEventListener("mousemove", this.#resizeColumnMove);
      document.addEventListener("mouseup", this.#resizeColumnEnd);
    }

    #resizeColumnMove = (event) => {
      if (!this.#resizingColumn) return;

      event.preventDefault();
      const newWidth = this.#resizingColumn.startWidth + (event.clientX - this.#resizingColumn.startX);
      this.#resizingColumn.element.style.width = `${newWidth}px`;
    }

    #resizeColumnEnd = (event) => {
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

    #resizeColumnDoubleClick = (event) => {
      const header = event.target.closest("th");
      header.style.width = "0px";
    }

    #dragColumnStart = (event) => {
      const field = event.target.dataset.dtField;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", field);
    }

    #dragColumnOver = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      return false;
    }

    #dragColumnEnter = (event) => {
      event.target.classList.add("dt-drag-over");
    }

    #dragColumnLeave = (event) => {
      event.target.classList.remove("dt-drag-over");
    }

    #dragColumnDrop = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const dragField = event.dataTransfer.getData("text/plain");
      const dropField = event.currentTarget.dataset.dtField;
      
      const columns = Object.values(this.#columns);
      const dragIndex = columns.findIndex((col) => col.field === dragField);
      const dropIndex = columns.findIndex((col) => col.field === dropField);

      if (dragIndex > -1 && dropIndex > -1) {
        const [draggedColumn] = columns.splice(dragIndex, 1);
        columns.splice(dropIndex, 0, draggedColumn);

        // Update the #columns object
        this.#columns = Object.fromEntries(columns.map((col) => [col.field, col]));

        // Re-render the table
        this.#updateHeaders();
        this.#updateTable();

        this.#table.dispatchEvent(new CustomEvent(DataTable.Events.COL_REARRANGE, {
          detail: {
            draggedColumn: draggedColumn,
            dropColumn: this.#getColumn(dropField),
            columns: columns,
          },
          bubbles: true,
          cancelable: true,
        }));
      }
    }

    #dragColumnEnd = (event) => {
      document.querySelectorAll(".dt-drag-over").forEach((el) => {
        el.classList.remove("dt-drag-over");
      });
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
     * @param {object} options
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
      const actualHeight = this.#element.offsetHeight;
      const viewHeight = this.#container.offsetHeight;

      if (!warned && actualHeight < totalContentHeight.toFixed(0) - 1) {
        warned = true;
        console.error("Max element height exceeded. Virtual scroll may not work.");
      }

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
      } else if (this.#rowHeight * this.#rowCount > MAX_ELEMENT_HEIGHT) {
        // This seems to be Chrome's max height of an element based on some random testing.
        console.warn(
          "Virtual scroll height exceeded maximum known element height."
        );
      }
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

  /**
   * Converts a string from camelCase or snake_case to a human-readable format.
   * @param {string} str - The input string (e.g., "camelCase" or "snake_case").
   * @returns {string} - The human-readable string (e.g., "Camel Case" or "Snake Case").
   */
  const toHumanReadable = (str) => {
    return str
      // Replace underscores with spaces
      .replace(/_/g, " ")
      // Insert spaces before uppercase letters (for camelCase)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      // Capitalize the first letter of each word
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  let warned = false;
  const WARN_ROW_COUNT = 10_000;
  const INDEX_COL_FIELD = "_dt_index";
  const MAX_ELEMENT_HEIGHT = 33554400;

  /** @type {TableClasses} */
  const DEFAULT_CLASSES = {
    scroller: "dt-scroller",
    thead: "dt-headers",
  };

  /**
   * @typedef {object} ColumnOptions
   * @property {string} field                       - Field name within the data object. Can be nested.
   * @property {string} title                       - Column title to be displayed in the header.
   * @property {boolean} sortable                   - If true, the column can be sorted.
   * @property {boolean} searchable                 - If true, the column can be searched.
   * @property {boolean} tokenize                   - If true, the column will be tokenized for search.
   * @property {ValueFormatter} valueFormatter      - Callback used to format the value for display.
   * @property {ElementFormatter} elementFormatter  - Callback used to format the element for display.
   * @property {function} sorter                    - Function used to sort the column.
   * @property {function} sortValue                 - Function used to get the value to sort on. Will be cached on initial data load
   * @property {FilterValueCallback} filter         - Function used to filter the column.
   * @property {Element} element                    - The header element for the column.
   * @property {string} sortOrder                   - The current sort order of the column.
   * @property {number} sortPriority                - The sort priority of the column.
   * @property {boolean} visible                    - If true, the column is visible.
   */

  /**
   * @typedef {object} TableClasses
   * @property {string | string[]} scroller
   * @property {string | string[]} thead
   * @property {string | string[]} tbody
   * @property {string | string[]} tfoot
   * @property {string | string[]} tr
   * @property {string | string[]} th
   * @property {string | string[]} td
   */

  /**
   * @typedef {object} TableOptions
   * @property {RowFormatter} formatter             - Callback used to apply any custom formatting to a row.
   * @property {ColumnOptions[]} columns            - List of columns to be created. Will be merged with any headers in the DOM that have a matching data-field attribute.
   * @property {object[]} data                      - Data to be loaded to the table.
   * @property {boolean | number} virtualScroll     - Automatically enables virtual scroll for the given number of rows.
   *                                                  If boolean, completely enables or disables it. Defaults to 1000.
   * @property {boolean} highlightSearch            - If true, search results will be wrapped in a mark tag.
   * @property {boolean} resizeable                 - If true, columns can be resized by dragging the header.
   * @property {boolean} rearrangeable              - If true, columns can be rearranged by dragging the header.
   * @property {string[]} extraSearchFields         - Extra fields in the row to be searched. Used for data that doesn't have a column.
   * @property {string} noDataText                  - Text to display if the provided data is empty.
   * @property {string} noMatchText                 - Text to display if search / filter result is empty.
   * @property {TableClasses} classes               - Classes to be applied to created elements.
   * @property {TokenizerFunction} tokenizer        - Function used to tokenize queries and field values.
   */

  /**
   * @callback RowFormatter
   * @param {object} row
   * @param {HTMLElement} element
   */

  /**
   * @callback ValueFormatter
   * @param {any} value
   * @param {object} row
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
   * @callback FilterRowCallback
   * @param {object} row - The row to be tested.
   * @param {number} index - Index of the given row.
   * @returns {boolean} True to keep value, false to filter it out.
   */

  /**
   * @callback FilterValueCallback
   * @param {any} value - The value to be tested.
   * @param {any} filter - The filter to be tested against.
   * @returns {boolean} True to keep value, false to filter it out.
   */

  exports.DataTable = DataTable;

}));
