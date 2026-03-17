import type {
  ColumnOptions,
  ColumnState,
  DisplayColumnOptions,
  ExportOptions,
  NestedKeyOf,
  RestorableColumnState,
  RestorableTableState,
  RowId,
  RowPartsCallback,
  SortOrder,
  TableState,
  UnspecifiedRecord,
  YatlTableApi,
} from '../types';

import {
  getColumnStateChanges,
  getNestedValue,
  isDisplayColumn,
  setNestedValue,
} from '../utils';

import { highlightText, toHumanReadable } from './utils';

import {
  YatlCellEditEvent,
  YatlColumnReorderRequest,
  YatlColumnSortRequest,
  YatlRowClickEvent,
  YatlRowSelectRequest,
  YatlTableControllerEvent,
} from '../events';

import { html, LitElement, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import '@lit-labs/virtualizer';
import { LitVirtualizer } from '@lit-labs/virtualizer';
import { virtualizerRef } from '@lit-labs/virtualizer/virtualize.js';
import {
  ControllerEventMap,
  YatlTableController,
} from '../table-controller/table-controller';
import styles from './table.styles';

// #region --- Constants ---

// #endregion

/**
 * A virtualized data table capable of handling complex sorting, filtering, and tokenized searching.
 *
 * @element yatl-table
 * @summary A high-performance grid engine for rugged environments.
 *
 * @fires yatl-cell-edit - Fired after a cell value has been edited.
 * @fires yatl-row-click - Fired when a user clicks a row.
 * @fires yatl-row-select-request - Fired before the row selection changes. Cancellable
 * @fires yatl-row-select - Fired when the row selection changes.
 * @fires yatl-column-sort-request - Fired before a column sort order changes. Cancellable.
 * @fires yatl-column-sort - Fired when a column sort order changes.
 * @fires yatl-column-toggle - Fired when a column's visibility changes.
 * @fires yatl-column-resize - Fired after a column has been resized by the user.
 * @fires yatl-column-reorder-request - Fired when the user drops a column into a new position. Cancellable.
 * @fires yatl-column-reorder - Fired after the column order changes.
 * @fires yatl-table-search - Fired when the search query is updated.
 * @fires yatl-table-view-change - Fired when the visible slice of data changes due to sorting, filtering, or data updates. Payload contains the processed rows.
 * @fires yatl-table-state-change - Fired when any persistable state (width, order, sort, query) changes. Used for syncing with local storage.
 */
@customElement('yatl-table')
export class YatlTable<T extends object = UnspecifiedRecord>
  extends LitElement
  implements YatlTableApi<T>
{
  public static override styles = [styles];

  @query('.table')
  private tableElement!: HTMLElement;
  @query('lit-virtualizer')
  private virtualizer?: LitVirtualizer;
  @query('.cell.is-editing > *')
  private editor?: HTMLElement;

  private get virtualizerRef() {
    if (this.virtualizer) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.virtualizer as any)[virtualizerRef];
    }
  }

  // #region --- State Data ---

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

  @state()
  private useYatlUi = false;

  @state()
  private editingState: {
    id: RowId;
    field: NestedKeyOf<T>;
    originalValue: unknown;
  } | null = null;

  private _controller = new YatlTableController<T>(this);

  // #endregion

  // #region --- Properties ---

  public get controller() {
    return this._controller;
  }

  @property({ attribute: false })
  public set controller(controller) {
    if (this._controller === controller) {
      return;
    }

    const oldController = this._controller;
    if (this.isConnected) {
      this.removeControllerListeners(oldController);
      this.addControllerListeners(controller);
    }

    oldController.detach(this);
    controller.attach(this);

    this._controller = controller;
  }

  public get columns() {
    return this.controller.columns;
  }

  @property({ attribute: false })
  public set columns(columns) {
    if (this.columns === columns) {
      return;
    }

    for (const column of columns) {
      if (isDisplayColumn(column) && column.title === undefined) {
        column.title = toHumanReadable(column.field);
      }
    }

    this.controller.columns = columns;
  }

  /**
   * Gets a list of columns with the display role
   * **This will always be ordered the same as the visual column order**
   */
  public get displayColumns() {
    return this.controller.displayColumns;
  }

  public get columnStates() {
    return this.controller.columnStates;
  }

  @property({ attribute: false })
  public set columnStates(states) {
    let changed = false;
    for (const state of states) {
      const oldState = this.getColumnState(state.field);
      const stateChanges = getColumnStateChanges(oldState, state);
      if (stateChanges.length) {
        changed = true;
        break;
      }
    }

    if (!changed) {
      return;
    }

    this.controller.columnStates = states;
  }

  public get data() {
    return this.controller.data;
  }

  @property({ attribute: false })
  public set data(value: T[]) {
    this.controller.data = value;
  }

  public get filteredData() {
    return this.controller.filteredData;
  }

  public get dataUpdateTimestamp() {
    return this.controller.dataUpdateTimestamp;
  }

  public get filters() {
    return this.controller.filters;
  }

  @property({ attribute: false })
  public set filters(filters) {
    if (this.filters === filters) {
      return;
    }
    this.controller.filters = filters;
  }

  /** @attr search-query */
  public get searchQuery() {
    return this.controller.searchQuery;
  }

  @property({ type: String, attribute: 'search-query' })
  public set searchQuery(query) {
    if (this.searchQuery === query) {
      return;
    }
    this.controller.searchQuery = query;
  }

  /** @attr tokenized-search */
  public get tokenizedSearch() {
    return this.controller.tokenizedSearch;
  }

  @property({ type: Boolean, attribute: 'tokenized-search' })
  public set tokenizedSearch(enable) {
    if (this.tokenizedSearch === enable) {
      return;
    }
    this.controller.tokenizedSearch = enable;
  }

  /** @attr scored-search */
  public get scoredSearch() {
    return this.controller.scoredSearch;
  }

  @property({ type: Boolean, attribute: 'scored-search' })
  public set scoredSearch(enable) {
    if (this.scoredSearch === enable) {
      return;
    }
    this.controller.scoredSearch = enable;
  }

  public get searchTokenizer() {
    return this.controller.searchTokenizer;
  }

  @property({ attribute: false })
  public set searchTokenizer(tokenizer) {
    if (this.searchTokenizer === tokenizer) {
      return;
    }
    this.controller.searchTokenizer = tokenizer;
  }

  /** @attr row-selection-method */
  public get rowSelectionMethod() {
    return this.controller.rowSelectionMethod;
  }

  @property({ type: String, attribute: 'row-selection-method' })
  public set rowSelectionMethod(selection) {
    if (this.rowSelectionMethod === selection) {
      return;
    }
    this.controller.rowSelectionMethod = selection;
  }

  public get selectedRowIds() {
    return this.controller.selectedRowIds;
  }

  @property({ attribute: false })
  public set selectedRowIds(rows) {
    const oldValue = new Set(this.selectedRowIds);
    if (oldValue.size === rows.length && rows.every(r => oldValue.has(r))) {
      return;
    }

    this.controller.selectedRowIds = rows;
  }

  public get storageOptions() {
    return this.controller.storageOptions;
  }

  @property({ attribute: false })
  public set storageOptions(options) {
    // TODO: Check if anything changed
    this.controller.storageOptions = options;
  }

  public get rowIdCallback() {
    return this.controller.rowIdCallback;
  }

  @property({ attribute: false })
  public set rowIdCallback(callback) {
    if (this.rowIdCallback === callback) {
      return;
    }
    this.controller.rowIdCallback = callback;
  }

  @property({ type: Boolean, reflect: true })
  public striped = false;

  @property({ type: Boolean })
  public sortable = false;

  @property({ type: Boolean })
  public resizable = false;

  @property({ type: Boolean })
  public reorderable = false;

  /** @attr row-numbers */
  @property({ type: Boolean, attribute: 'row-numbers' })
  public rowNumbers = false;

  /** @attr virtual-scroll */
  @property({ type: Boolean, attribute: 'virtual-scroll' })
  public virtualScroll = false;

  /** @attr hide-footer */
  @property({ type: Boolean, attribute: 'hide-footer' })
  public hideFooter = false;

  /** @attr disable-editing */
  @property({ type: Boolean, attribute: 'disable-editing' })
  public disableEditing = false;

  /**
   * @default "-"
   * @attr null-value-placeholder
   */
  @property({ type: String, attribute: 'null-value-placeholder' })
  public nullValuePlaceholder = '-';

  /**
   * @default "No records to display"
   * @attr emptry-message
   */
  @property({ type: String, attribute: 'empty-message' })
  public emptyMessage = 'No records to display';

  /**
   * @default "No matching records found"
   * @attr no-results-message
   */
  @property({ type: String, attribute: 'no-results-message' })
  public noResultsMessage = 'No matching records found';

  @property({ attribute: false })
  public rowParts: RowPartsCallback<T> | null = null;

  // #endregion

  // #region --- Public Methods ---

  public getColumn(field: NestedKeyOf<T>) {
    return this.controller.getColumn(field);
  }

  public getDisplayColumn(field: NestedKeyOf<T>) {
    const column = this.getColumn(field);
    if (column && isDisplayColumn(column)) {
      return column;
    }
  }

  /**
   * Gets a copy of the current state of the table.
   */
  public getTableState(): TableState<T> {
    return this.controller.getTableState();
  }

  /**
   * Restores the table to the provided state.
   * @param state - The state to restore the table to.
   */
  public updateTableState(state: RestorableTableState<T>) {
    return this.controller.updateTableState(state);
  }

  public getColumnState(field: NestedKeyOf<T>) {
    return this.controller.getColumnState(field);
  }

  public updateColumnState(
    field: NestedKeyOf<T>,
    state: RestorableColumnState<T>,
  ) {
    return this.controller.updateColumnState(field, state);
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
    return this.controller.sort(field, order, clear);
  }

  /**
   * Toggles the visibility of hte specified column
   * @param field - The field name of the column to toggle.
   * @param visible - Optionally force the visibility state.
   */
  public toggleColumnVisibility(field: NestedKeyOf<T>, visible?: boolean) {
    return this.controller.toggleColumnVisibility(field, visible);
  }

  /**
   * Shows the specified column
   * @param field - The field name of the column to show.
   */
  public showColumn(field: NestedKeyOf<T>) {
    return this.controller.showColumn(field);
  }

  /**
   * Hides the specified column
   * @param field - The field name of the column to hide.
   */
  public hideColumn(field: NestedKeyOf<T>) {
    return this.controller.hideColumn(field);
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
    return this.controller.moveColumn(field, newPosition);
  }

  public resizeColumn(field: NestedKeyOf<T>, width: number | null) {
    return this.controller.resizeColumn(field, width);
  }

  public isRowSelected(row: T) {
    return this.controller.isRowSelected(row);
  }

  /**
   * Toggles the selection state of a specific row.
   */
  public toggleRowSelection(row: T, state?: boolean) {
    return this.controller.toggleRowSelection(row, state);
  }

  /**
   * Selects a specific row.
   */
  public selectRow(row: T) {
    return this.controller.selectRow(row);
  }

  /**
   * Deselects a specific row.
   */
  public deselectRow(row: T) {
    return this.controller.deselectRow(row);
  }

  /**
   * Selects all currently visible rows (for "Select All" checkbox).
   */
  public selectAll() {
    return this.controller.selectAll();
  }

  /**
   * Clears all selection.
   */
  public deselectAll() {
    return this.controller.deselectAll();
  }

  /**
   * Export the current visible table data to a CSV file.
   * @param filename - The name of the file to save.
   * @param options - Options for configuring what should be exported.
   */
  public export(
    filename: string,
    options: ExportOptions = {
      includeAllRows: false,
      includeHiddenColumns: false,
      includeInternalColumns: false,
    },
  ) {
    const blob = this.controller.export(options);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
  }

  public async print(title?: string) {
    if (title) {
      document.title = title;
    }

    const printSheet = new CSSStyleSheet();
    printSheet.replaceSync(`
      @media print {
        body > *:not(.yatl-printable) { 
          display: none !important; 
        }
        
        body { 
          height: auto !important; 
          overflow: visible !important; 
          background: white !important;
        }
      }
    `);
    const documentStyleSheets = document.adoptedStyleSheets;
    document.adoptedStyleSheets = [...documentStyleSheets, printSheet];

    const printTable = document.createElement('yatl-table') as YatlTable<T>;
    printTable.classList.add('yatl-printable');
    printTable.controller = this.controller;
    printTable.virtualScroll = false;
    document.body.append(printTable);
    await printTable.updateComplete;
    requestAnimationFrame(() => {
      window.print();
      printTable.remove();
      document.adoptedStyleSheets = documentStyleSheets;
    });
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
    return this.controller.getRow(id);
  }

  /**
   * Finds the first row where {@link field} matches {@link value}
   * @param field - The field name within the row data to search.
   * @param value - The value to match against the field's content.
   * @returns The found row, or undefined if no match is found.
   */
  public findRow(field: NestedKeyOf<T>, value: unknown) {
    return this.controller.findRow(field, value);
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
    return this.controller.findRowIndex(field, value);
  }

  public updateRow(rowId: RowId, data: Partial<T>) {
    return this.controller.updateRow(rowId, data);
  }

  /**
   * This will force the underlying virtual scroller
   * to re-calculate row sizes and positions and re-render.
   * This is specifically here to fix virtual scroll tables
   * that are affected by scale animations.
   * E.g. when put in a yatl-dialog.
   */
  public reflowVirtualizer() {
    const virtualizerRef = this.virtualizerRef;
    if (virtualizerRef) {
      // trick the virtualizer to thinking
      // the items changed and force a re-measure.
      virtualizerRef._itemsChanged = true;
      virtualizerRef._rangeChanged = true;
      virtualizerRef._measureChildren();
      virtualizerRef._itemsChanged = false;
      virtualizerRef._rangeChanged = false;
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
    return this.controller.updateRowAtIndex(index, data);
  }

  /**
   * Deletes the row with the matching ID.
   * @param rowIds - The IDs rows to delete
   */
  public deleteRow(...rowIds: RowId[]) {
    return this.controller.deleteRow(...rowIds);
  }

  /**
   * Deletes a row at a specific original index from the table.
   * @param index - The original index of the row to delete.
   */
  public deleteRowAtIndex(index: number) {
    return this.controller.deleteRowAtIndex(index);
  }

  // #endregion

  // #region Render Methods

  protected renderColumnSortIcon(
    column: DisplayColumnOptions<T>,
    state: ColumnState<T>,
  ) {
    return column.sortable ?? this.sortable
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
    return column.resizable ?? this.resizable
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

  protected renderHeaderCell(column: DisplayColumnOptions<T>) {
    if (!column) {
      return nothing;
    }

    const state = this.getColumnState(column.field);
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
        title=${title}
        draggable=${ifDefined(this.reorderable ? true : undefined)}
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
      reorderable: this.reorderable,
    };
    return html`
      <div role="rowgroup" part="header" class=${classMap(classes)}>
        <div role="row" class="row header-row" part="row header-row">
          ${this.renderRowNumberHeader()} ${this.renderSelectionHeader()}
          ${this.displayColumns.map(column => this.renderHeaderCell(column))}
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

    const indices = this.controller.getRowHighlightIndicies(row);

    return indices
      ? highlightText(String(value), indices[column.field])
      : value;
  }

  protected renderCell(column: DisplayColumnOptions<T>, row: T) {
    let value = getNestedValue(row, column.field);
    // Get the user parts from the raw value
    // before we call the value formatter.
    let userParts = column.cellParts?.call(this, value, column.field, row);
    if (Array.isArray(userParts)) {
      userParts = userParts.join(' ');
    }

    const inputType = this.getInputTypeFromValue(value);
    const classes = {
      cell: true,
      'is-number': inputType === 'number',
    };

    const rowId = this.controller.getRowId(row);
    const field = column.field;
    if (
      column.editor &&
      !this.disableEditing &&
      this.editingState &&
      this.editingState.id === rowId &&
      this.editingState.field === field
    ) {
      return this.renderCellWrapper(html`
        <div
          role="cell"
          part="cell body-cell cell-${column.field}"
          class=${classMap({ ...classes, 'is-editing': true })}
          data-field=${column.field}
        >
          ${column.editor.render(value, field, row, this.controller)}
        </div>
      `);
    }

    if (typeof column.valueFormatter === 'function') {
      value = column.valueFormatter(value, row);
    }

    return this.renderCellWrapper(html`
      <div
        role="cell"
        part="cell body-cell cell-${column.field} ${userParts}"
        data-field=${column.field}
        class=${classMap(classes)}
        title=${ifDefined(value ? String(value) : undefined)}
        @click=${(event: MouseEvent) => this.handleCellClick(event, row, field)}
        @dblclick=${() => this.handleCellDoubleClick(row, field)}
      >
        <span class="truncate">
          ${this.renderCellContents(value, column, row)}
        </span>
      </div>
    `);
  }

  protected renderCheckbox(row: T, selected: boolean) {
    return this.useYatlUi
      ? html`<yatl-checkbox
          part="row-checkbox"
          class="row-checkbox"
          .checked=${selected}
          @change=${(event: Event) =>
            this.handleRowSelectionClicked(event, row)}
        ></yatl-checkbox>`
      : html`<input
          part="row-checkbox"
          class="row-checkbox"
          type="checkbox"
          .checked=${selected}
          @change=${(event: Event) =>
            this.handleRowSelectionClicked(event, row)}
        />`;
  }

  protected renderRowSelectorCell(row: T, selected: boolean) {
    return this.renderCellWrapper(html`
      <div part="cell body-cell" class="cell body-cell">
        <div part="row-selector-cell" class="row-selector-cell">
          <label> ${this.renderCheckbox(row, selected)} </label>
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
    const selected = this.isRowSelected(row);
    let userParts = this.rowParts?.(row) ?? '';
    if (Array.isArray(userParts)) {
      userParts = userParts.join(' ');
    }

    const classes = {
      row: true,
      selected,
      'row-even': renderIndex % 2 === 0,
      'row-odd': renderIndex % 2 !== 0,
    };
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
        ${this.displayColumns.map(column => this.renderCell(column, row))}
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

    if (this.virtualScroll) {
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
        item => this.controller.getRowId(item),
        (item, index) => this.renderRow(item, index),
      )}
    `;
  }

  protected renderFooter() {
    if (this.hideFooter) {
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

    const lastUpdateText = this.dataUpdateTimestamp
      ? formatter.format(this.dataUpdateTimestamp)
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
      <div
        role="table"
        aria-label="Data Table"
        aria-rowcount=${this.filteredData.length}
        part="table"
        class="table"
        style=${styleMap(style)}
      >
        <div class="scroller">
          ${this.renderHeader()}
          <div class="body" role="rowgroup">
            <slot name="body">${this.renderBodyContents()}</slot>
          </div>
        </div>
        ${this.renderFooter()}
      </div>
    `;
  }

  private renderCellWrapper(content: unknown) {
    return html` <div class="cell-wrapper">${content}</div> `;
  }

  // #endregion
  // #region --- Lifecycle Methods ---

  public override connectedCallback(): void {
    super.connectedCallback();
    this.addControllerListeners(this.controller);
    this.addEventListener('mousedown', this.handleMouseDown);
    this.addEventListener('keydown', this.handleCellInputKeypress);

    // We want to use the checkbox from yatl-ui if it is available.
    // If it gets defined, rerender with it.
    if (!this.useYatlUi) {
      customElements.whenDefined('yatl-checkbox').then(() => {
        this.useYatlUi = true;
      });
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeControllerListeners(this.controller);
    this.removeEventListener('mousedown', this.handleMouseDown);
    this.removeEventListener('keydown', this.handleCellInputKeypress);

    // Clean up just in case
    window.removeEventListener('mousemove', this.handleResizeMouseMove);
    window.removeEventListener('mouseup', this.handleResizeMouseUp);
  }

  public override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (this.editor && document.activeElement !== this.editor) {
      setTimeout(() => {
        this.editor?.focus();
        if (this.editor instanceof HTMLInputElement) {
          this.editor.select();
        }
      });
    }
  }

  // #endregion
  // #region Utilities

  private readonly eventNames: (keyof ControllerEventMap)[] = [
    'yatl-column-reorder',
    'yatl-column-resize',
    'yatl-column-sort',
    'yatl-column-toggle',
    'yatl-row-select',
    'yatl-table-search',
    'yatl-table-state-change',
    'yatl-table-view-change',
  ];

  private addControllerListeners(controller: YatlTableController<T>) {
    for (const name of this.eventNames) {
      controller.addEventListener(name, this.redispatchControllerEvent);
    }
  }

  private removeControllerListeners(controller: YatlTableController<T>) {
    for (const name of this.eventNames) {
      controller.removeEventListener(name, this.redispatchControllerEvent);
    }
  }

  private redispatchControllerEvent = (event: Event) => {
    if (event instanceof YatlTableControllerEvent) {
      this.dispatchEvent(event.clone());
    }
  };

  private hasVisibleColumn() {
    return (
      this.displayColumns
        .map(column => this.getColumnState(column.field))
        .filter(state => state.visible).length > 0
    );
  }

  /**
   * Gets the width of each column in the
   * order they will appear in the grid.
   */
  private getGridWidths() {
    const widths: string[] = [];

    if (this.rowNumbers) {
      widths.push('var(--yatl-row-number-column-width, 48px)');
    } else {
      widths.push('0');
    }

    if (this.rowSelectionMethod) {
      widths.push('var(--yatl-row-selector-column-width, 48px)');
    } else {
      widths.push('0');
    }

    for (const column of this.displayColumns) {
      const state = this.getColumnState(column.field);

      // Check if we have a fixed pixel width (User resized it)
      const hasPixelWidth = state.width != null;

      if (state.visible) {
        if (hasPixelWidth) {
          widths.push(`${state.width}px`);
        } else {
          // If we don't have a fixed pixel width it means this column
          // was added after the table already had a saved state.
          // Give it a min width to ensure it gets some space.
          widths.push('minmax(50px, 1fr)');
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

  private getInputTypeFromValue(
    value: unknown,
  ): 'text' | 'number' | 'date' | 'boolean' {
    const valueType = typeof value;
    if (valueType === 'bigint' || valueType === 'number') {
      return 'number';
    }
    if (valueType === 'boolean') {
      return 'boolean';
    }
    if (value instanceof Date) {
      return 'date';
    }
    return 'text';
  }

  private getNextEditableField(row: T, currentField?: NestedKeyOf<T>) {
    let index = 0;
    if (currentField) {
      index = this.displayColumns.findIndex(c => c.field === currentField);
      if (index < 0) {
        index = 0;
      } else {
        index++;
      }
    }

    for (const col of this.displayColumns.slice(index)) {
      if (col.editor && col.editor.canEdit(col.field, row)) {
        return col.field;
      }
    }
  }

  private async saveEdits() {
    if (!this.editingState) {
      return;
    }

    const { id: rowId, field, originalValue } = this.editingState;
    const column = this.getDisplayColumn(field);
    const row = this.getRow(rowId);
    if (!column?.editor || !row) {
      return;
    }

    let value;
    const result = column.editor.save(
      originalValue,
      field,
      row,
      this.controller,
    );

    if (result instanceof Promise) {
      value = await result;
    } else {
      value = result;
    }

    if (value !== undefined) {
      const updateData = {};
      setNestedValue(updateData, field, value);
      this.updateRow(rowId, updateData as Partial<T>);
      this.dispatchEvent(
        new YatlCellEditEvent(row, rowId, field, originalValue, value),
      );
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
    const state = this.getColumnState(column.field);
    let sortOrder: SortOrder | null = null;
    if (!state?.sort) {
      sortOrder = 'asc';
    } else if (state.sort.order === 'asc') {
      sortOrder = 'desc';
    }

    const requestEvent = new YatlColumnSortRequest(
      column.field,
      sortOrder,
      multiSort,
    );
    if (!this.dispatchEvent(requestEvent)) {
      return;
    }

    this.sort(column.field, sortOrder, !multiSort);
  };

  private handleCellClick = (
    event: MouseEvent,
    row: T,
    field: NestedKeyOf<T>,
  ) => {
    // Ignore events if the user is highlighting text
    if (this.editingState || window.getSelection()?.toString()) {
      return;
    }

    // Ignore links and buttons
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'A' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'YATL-BUTTON'
    ) {
      return;
    }

    const rowId = this.controller.getRowId(row);
    const rowIndex = this.controller.getRowIndex(row);
    this.dispatchEvent(
      new YatlRowClickEvent(row, rowId, rowIndex, field, event),
    );
  };

  private handleCellDoubleClick(row: T, field: NestedKeyOf<T>) {
    const column = this.getDisplayColumn(field);
    if (!column || !column.editor || !column.editor.canEdit(field, row)) {
      return;
    }

    column.editor.reset();
    const value = getNestedValue(row, field);
    this.editingState = {
      id: this.controller.getRowId(row),
      field: field,
      originalValue: value,
    };
  }

  private handleCellInputKeypress(event: KeyboardEvent) {
    if (!this.editingState) {
      return;
    }

    if (event.key === 'Escape') {
      this.editingState = null;
    } else if (event.key === 'Enter') {
      this.saveEdits();
      this.editingState = null;
    } else if (event.key === 'Tab') {
      this.saveEdits();

      const { id: rowId } = this.editingState;
      const row = this.getRow(rowId)!;

      // Try to find the next editable field in this row.
      let nextColumn = this.getNextEditableField(row, this.editingState.field);
      if (nextColumn) {
        return this.handleCellDoubleClick(row, nextColumn);
      }

      let rowIndex = this.filteredData.indexOf(row);
      // This should never happen but lets just be safe.
      if (rowIndex < 0) {
        return;
      }

      rowIndex++;
      if (rowIndex >= this.filteredData.length) {
        rowIndex = 0;
      }
      const nextRow = this.filteredData[rowIndex];

      // Get first editable column
      nextColumn = this.getNextEditableField(nextRow);
      if (!nextColumn) {
        return;
      }
      this.handleCellDoubleClick(nextRow, nextColumn);
      event.preventDefault();
    }
  }

  private handleMouseDown(event: Event) {
    const containsEditing = event
      .composedPath()
      .filter(e => e instanceof HTMLElement)
      .some(e => e.classList.contains('is-editing'));

    if (this.editingState && !containsEditing) {
      console.log('saving');
      this.saveEdits();
      this.editingState = null;
    }
  }

  private handleResizeMouseDown(event: MouseEvent, field: NestedKeyOf<T>) {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const header = target.closest('.cell');
    if (!header) {
      return;
    }

    const columnIndex = this.displayColumns.findIndex(
      column => column.field === field,
    );
    if (columnIndex < 0) {
      return;
    }

    this.tableElement.classList.add('resizing');

    // Freeze the current widths as soon as the users starts resizing
    this.tableElement
      .querySelectorAll<HTMLElement>('.header .cell')
      .forEach(element => {
        const field = element.dataset.field as NestedKeyOf<T> | undefined;
        if (field) {
          const state = this.getColumnState(field);
          state.width = element.getBoundingClientRect().width;
          this.updateColumnState(field, state);
        }
      });

    const gridWidths = this.getGridWidths();
    this.resizeState = {
      active: true,
      startX: event.pageX,
      startWidth: header.getBoundingClientRect().width,
      columnIndex: columnIndex + 2, // row number column + selector column
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
      this.resizeState.currentWidths[
        this.resizeState.columnIndex
      ] = `${newWidth}px`;
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

      this.resizeColumn(this.resizeState.columnField, finalWidth);
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

    const newColumns = this.displayColumns;
    const originalIndex = newColumns.findIndex(
      col => col.field === this.dragColumn,
    );
    const newIndex = newColumns.findIndex(col => col.field === field);

    const requestEvent = new YatlColumnReorderRequest(
      this.dragColumn,
      originalIndex,
      newIndex,
    );
    if (!this.dispatchEvent(requestEvent)) {
      return;
    }

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

    const rowId = this.controller.getRowId(row);
    const selectedRows = this.selectedRowIds;
    const requestEvent = new YatlRowSelectRequest(
      rowId,
      selected,
      selectedRows,
    );
    if (!this.dispatchEvent(requestEvent)) {
      inputElement.checked = !selected;
      return;
    }

    this.toggleRowSelection(row, selected);
  };

  // #endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-table': YatlTable;
  }
}
