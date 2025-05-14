type SortOrder = "asc" | "desc" | null;
/**
 * Callback for formatting a row's  HTML element.
 * @param row - The row data.
 * @param element - The row element.
 */
type RowFormatterCallback = (row: any, element: HTMLElement) => void;
/**
 * Callback for formatting the value of a cell.
 * Called when the cell is created and when exporting to CSV.
 * @param value - The value of the cell.
 * @param row - The row data.
 */
type ValueFormatterCallback = (value: any, row: object) => string;
/**
 * Callback for formatting a cell's HTML element.
 * @param value - The value of the field.
 * @param row - The row data.
 * @param element - The cell element.
 */
type CellFormatterCallback = (value: any, row: object, element: HTMLElement) => void;
/**
 * Callback for comparing two values.
 * @param a - The first value.
 * @param b - The second value.
 * @returns A negative number if a < b, a positive number if a > b, or 0 if they are equal.
 */
type ComparatorCallback = (a: any, b: any) => number;
/**
 * Callback for caching the sort value of a field
 * @param value - The value of the field.
 * @returns The numerical value of the field
 */
type SortValueCallback = (value: any) => number;
/**
 * Callback for tokenizing a value into a list of string tokens.
 * @param value - The value to tokenize.
 * @returns An array of tokens.
 */
type TokenizerCallback = (value: any) => string[];
/**
 * Callback for filtering a row.
 * @param row - The row data.
 * @param index - The index of the row.
 * @returns True if the row matches the filter, false otherwise.
 */
type FilterCallback = (row: object, index: number) => boolean;
/**
 * Callback for filtering a field value against the filter data.
 * @param value - The value to filter.
 * @param filter - The filter to apply.
 * @returns True if the value matches the filter, false otherwise.
 */
type ColumnFilterCallback = (value: any, filter: any) => boolean;
/**
 * Column options for the table.
 */
interface ColumnOptions {
    /**
     * The field name in the data object.
     */
    field: string;
    /**
     * The title to display in the header.
     */
    title?: string;
    /**
     * Whether the column is sortable.
     */
    sortable?: boolean;
    /**
     * Whether the column is searchable.
     */
    searchable?: boolean;
    /**
     * Whether the column's data should be tokenized for searching.
     */
    tokenize?: boolean;
    /**
     * The initial sort order of the column.
     */
    sortOrder?: SortOrder;
    /**
     * The inital sort priority of the column for sorting.
     * Lower numbers are sorted first.
     */
    sortPriority?: number;
    /**
     * Whether the column should be visible by default.
     */
    visible?: boolean;
    /**
     * Whether the column should be resizable.
     * Defaults to the table's resizable option.
     */
    resizable?: boolean;
    /**
     * The initial width of the column.
     * Can be a number (in pixels) or a string (e.g. "100px", "50%").
     */
    width?: string | number;
    /**
     * A function to format the value for display.
     */
    valueFormatter?: ValueFormatterCallback;
    /**
     * A function to format the element for display.
     */
    elementFormatter?: CellFormatterCallback;
    sorter?: (a: any, b: any) => number;
    filter?: FilterCallback;
}
interface ColumnState {
    readonly field: string;
    readonly title: string;
    visible?: boolean;
    sortOrder?: SortOrder;
    sortPriority?: number;
    width?: string;
}
interface TableClasses {
    scroller?: string | string[];
    thead?: string | string[];
    tbody?: string | string[];
    tfoot?: string | string[];
    tr?: string | string[];
    th?: string | string[];
    td?: string | string[];
}
interface TableOptions {
    formatter?: RowFormatterCallback;
    columns?: ColumnOptions[];
    data?: any[];
    virtualScroll?: boolean | number;
    highlightSearch?: boolean;
    resizable?: boolean;
    rearrangeable?: boolean;
    extraSearchFields?: string[];
    noDataText?: string;
    noMatchText?: string;
    classes?: TableClasses;
    tokenizer?: TokenizerCallback;
}

/**
 * Class for creating a DataTable that will add sort, search, filter, and virtual scroll to a table.
 */
declare class DataTable {
    #private;
    static Events: {
        ROW_CLICK: string;
        ROWS_CHANGED: string;
        COL_HIDE: string;
        COL_SHOW: string;
        COL_SORT: string;
        COL_RESIZE: string;
        COL_REARRANGE: string;
    };
    /**
     * @param  table - Selector or HTMLElement for the table.
     * @param options - Options for the table.
     */
    constructor(table: string | HTMLTableElement, { formatter, columns, data, virtualScroll, highlightSearch, resizable, rearrangeable, extraSearchFields, noDataText, noMatchText, classes, tokenizer, }?: TableOptions);
    /**
     * Gets a list of the ColumnStates for all columns in the table
     * Can be used to save / restore columns sates.
     */
    get columnStates(): ColumnState[];
    set columnStates(states: ColumnState[]);
    /**
     * Get the current data in the table.
     */
    get rows(): RowData[];
    /**
     * Get total row count of visible data.
     */
    get length(): number;
    /**
     * Get the current table element.
     */
    get table(): HTMLTableElement;
    /**
     * Get the current virtual scroll setting.
     * If the value is 0, virtual scroll is disabled.
     * If the value is true, virtual scroll is enabled.
     * If the value is a number, it will be used as the row count for virtual scroll.
     */
    get virtualScroll(): number | boolean;
    set virtualScroll(value: number | boolean);
    /**
     * Get the current virtual scroll status.
     */
    get virtualScrollStatus(): boolean;
    /**
     * Loads the given rows into the table.
     * This will overwrite any already existing rows.
     */
    loadData(rows: any[]): void;
    /**
     * Shows a message overlay that will cover the table.
     */
    showMessage(text: string, classes: string | string[]): void;
    /**
     * Search the table using the given query.
     * The query can be a string or a regular expression.
     * If the query is an empty string, it will clear the search.
     * @param query
     */
    search(query: string | RegExp): void;
    /**
     * Apply the given filters to the table.
     * Filters should be an object with keys for any columns
     * to be filtered and values to match against the underlying data.
     * E.g. {quantity: 1} will only show rows where the quantity column = 1
     * Can also be a function that will be called for each row.
     * @param filters
     */
    filter(filters: any | FilterCallback): void;
    /**
     * Sort the given column using the given order (asc or desc).
     * If order is none, the columns will be "unsorted" and revert
     * revert back to sorting the by the index ascending.
     * @param colName
     * @param order
     */
    sort(colName: string, order: SortOrder): void;
    /**
     * Set the visibility of a column.
     * @param colName
     * @param visible
     */
    setColumnVisibility(colName: string, visisble: boolean): void;
    /**
     * Show a column.
     * @param field
     */
    showColumn(field: string): void;
    /**
     * Hide a column.
     * @param field
     */
    hideColumn(field: string): void;
    /**
     * Export the current visible table data to a CSV file.
     * @param filename - The name of the file to save.
     * @param all - If true, export all rows. If false, only export the filtered rows.
     */
    export(filename: string, all?: boolean): void;
    /**
     * Scrolls to the given row index in the table.
     * @param index
     */
    scrollTo(index: number): void;
    /**
     * Sets the order of the columns in the table.
     * @param fields
     */
    setColumnOrder(fields: string[]): void;
    refresh(): void;
}
interface RowData {
    [key: string]: any;
    _metadata: RowMeatadata;
}
interface RowMeatadata {
    [key: string]: any;
    index: number;
    searchScore?: number;
    tokens?: string[];
    sortValue?: any;
}

interface Options {
    saveColumnSorting: boolean;
    saveColumnOrder: boolean;
    saveColumnVisibility: boolean;
    saveColumnWidth: boolean;
}
declare class LocalStorageAdapter {
    #private;
    /**
     * @param dataTable - The DataTable instance to monitor.
     * @param storageKey - The key to use for saving the state in localStorage.
     * @param options - The key to use for saving the state in localStorage.
     */
    constructor(dataTable: DataTable, storageKey: string, options?: Options);
    /**
     * Saves the current column state to localStorage.
     */
    saveState(): void;
    /**
     * Restores the column state from localStorage.
     */
    restoreState(): void;
    /**
     * Clears the saved state from localStorage.
     */
    clearState(): void;
}

export { type CellFormatterCallback, type ColumnFilterCallback, type ColumnOptions, type ColumnState, type ComparatorCallback, DataTable, type FilterCallback, LocalStorageAdapter, type RowFormatterCallback, type SortOrder, type SortValueCallback, type TableClasses, type TableOptions, type TokenizerCallback, type ValueFormatterCallback };
