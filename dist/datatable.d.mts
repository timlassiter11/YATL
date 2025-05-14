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
     * Gets a list of all columns in the table.
     */
    get columns(): ColumnData[];
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
    filter(filters: any | FilterRowCallback): void;
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
type SortOrder = "asc" | "desc" | null;
/**
 * Internal column data structure.
 */
interface ColumnData {
    field: string;
    title: string;
    sortable: boolean;
    searchable: boolean;
    tokenize: boolean;
    element: HTMLElement;
    visible: boolean;
    sortOrder: SortOrder;
    sortPriority?: number;
    resizeStartX: number | null;
    resizeStartWidth: number | null;
    valueFormatter?: ValueFormatter;
    elementFormatter?: ElementFormatter;
    filter?: FilterValueCallback;
    comparator?: (a: any, b: any) => number;
}
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
     * A function to format the value for display.
     */
    valueFormatter?: ValueFormatter;
    /**
     * A function to format the element for display.
     */
    elementFormatter?: ElementFormatter;
    sorter?: (a: any, b: any) => number;
    filter?: FilterValueCallback;
    /**
     * A function to compare two values for sorting.
     * This is used to override the default sorting behavior.
     */
    comparator?: (a: any, b: any) => number;
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
    formatter?: RowFormatter;
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
    tokenizer?: TokenizerFunction;
}
type RowFormatter = (row: object, element: HTMLElement) => void;
type ValueFormatter = (value: any, row: object) => string;
type ElementFormatter = (value: any, row: object, element: HTMLElement) => void;
type TokenizerFunction = (value: any) => string[];
type FilterRowCallback = (row: object, index: number) => boolean;
type FilterValueCallback = (value: any, filter: any) => boolean;
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

export { type ColumnData, type ColumnOptions, DataTable, type ElementFormatter, type FilterRowCallback, type FilterValueCallback, LocalStorageAdapter, type RowFormatter, type SortOrder, type TableClasses, type TableOptions, type TokenizerFunction, type ValueFormatter };
