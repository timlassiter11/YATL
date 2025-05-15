/**
 * Defines the possible sorting orders for columns.
 */
type SortOrder = "asc" | "desc" | null;
/**
 * Represents a generic data row in the table, an object with string keys and any values.
 */
type Row = Record<string, any>;
/**
 * Callback for formatting a row's  HTML element.
 * @param row - The row data.
 * @param element - The row element.
 */
type RowFormatterCallback = (row: Row, element: HTMLElement) => void;
/**
 * Callback for formatting the value of a cell.
 * Called when the cell is created and when exporting to CSV.
 * @param value - The value of the cell.
 * @param row - The row data.
 */
type ValueFormatterCallback = (value: any, row: Row) => string;
/**
 * Callback for formatting a cell's HTML element.
 * @param value - The value of the field.
 * @param row - The row data.
 * @param element - The cell element.
 */
type CellFormatterCallback = (value: any, row: Row, element: HTMLElement) => void;
/**
 * Callback for comparing two values.
 * @param a - The first value.
 * @param b - The second value.
 * @returns A negative number if a < b, a positive number if a > b, or 0 if they are equal.
 */
type ComparatorCallback = (a: any, b: any) => number;
/**
 * Callback for caching the sort value of a field
 * This function should derive a comparable value (often numerical or lowercase string) from the field's original value, to be used during sorting.
 * @param value - The value of the field.
 * @returns The derived value for sorting (e.g., a number or a standardized string).
 */
type SortValueCallback = (value: any) => number | string;
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
type FilterCallback = (row: Row, index: number) => boolean;
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
     * The initial sort priority of the column for sorting.
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
    /**
     * A function to use for sorting the column.
     * This overrides the default sorting behavior.
     */
    sorter?: ComparatorCallback;
    /**
     * A function to derive a comparable value from the cell's original value, specifically for sorting this column.
     * This can be used to preprocess and cache values (e.g., convert to lowercase, extract numbers) before comparison.
     */
    sortValue?: SortValueCallback;
    /**
     * A custom function to determine if a cell's value in this column matches a given filter criterion.
     * This is used when `DataTable.filter()` is called with an object-based filter that targets this column's field.
     * @param value - The cell's value.
     * @param filterCriterion - The criterion provided for this column in the main filter object.
     */
    filter?: ColumnFilterCallback;
}
/** Represents the current state of a column, often used for saving and restoring column configurations. */
interface ColumnState {
    /**
     * The unique field name of the column.
     */
    readonly field: string;
    /**
     * The user friendly title of the column.
     */
    readonly title: string;
    /**
     * The current visibility of the column.
     */
    visible?: boolean;
    /**
     * The current sort order of the column.
     */
    sortOrder?: SortOrder;
    /**
     * The current sort priority of the column.
     * Lower numbers are sorted first.
     */
    sortPriority?: number;
    /**
     * The currently set width of the column.
     */
    width?: string;
}
/**
 * Defines CSS classes to be applied to different parts of the table.
 */
interface TableClasses {
    /**
     * Classes for the scroller element.
     */
    scroller?: string | string[];
    /**
     * Classes for the thead element.
     */
    thead?: string | string[];
    /**
     * Classes for the tbody element.
     */
    tbody?: string | string[];
    /**
     * Classes for the tfoot element.
     */
    tfoot?: string | string[];
    /**
     * Classes for each table row element.
     */
    tr?: string | string[];
    /**
     * Classes for each header element.
     */
    th?: string | string[];
    /**
     * Classes for each cell element.
     */
    td?: string | string[];
}
/**
 * Options for configuring the table.
 */
interface TableOptions {
    /**
     * The column options for the table.
     */
    columns?: ColumnOptions[];
    /**
     * The initial data to load into the table.
     */
    data?: Row[];
    /**
     * Configures virtual scrolling.
     */
    virtualScroll?: boolean;
    /**
     * Whether to highlight search results in the table cells.
     */
    highlightSearch?: boolean;
    /**
     * Whether columns should be sortable by default.
     * Can be overridden on individual columns.
     */
    sortable?: boolean;
    /**
     * Whether columns should be searchable by default.
     * Can be overridden on individual columns.
     */
    searchable?: boolean;
    /**
     * Whether columns data should be tokenized for searching by default.
     * Can be overridden on individual columns.
     */
    tokenize?: boolean;
    /**
     * Whether columns should be resizable by default.
     * Can be overridden on individual columns.
     */
    resizable?: boolean;
    /**
     * Whether columns should be rearrangeable by drag and drop.
     */
    rearrangeable?: boolean;
    /**
     * Additional fields to include in the search.
     * Used for fields that are not displayed as columns.
     */
    extraSearchFields?: string[];
    /**
     * The text to display when there is no data in the table.
     */
    noDataText?: string;
    /**
     * The text to display when there are no matching records after filtering or searching.
     */
    noMatchText?: string;
    /**
     * Custom CSS classes to apply to various table elements.
     */
    classes?: TableClasses;
    /**
     * A function to format each row's HTML element.
     */
    rowFormatter?: RowFormatterCallback;
    /**
     * A function to use for tokenizing values for searching.
     */
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
    private static readonly DEFAULT_OPTIONS;
    /**
     * @param  table - Selector or HTMLElement for the table.
     * @param options - Options for the table.
     */
    constructor(table: string | HTMLTableElement, options?: TableOptions);
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
    get virtualScroll(): boolean;
    set virtualScroll(value: boolean);
    /**
     * Loads the given rows into the table.
     * This will overwrite any already existing rows.
     */
    loadData(rows: Row[]): void;
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
    filter(filters: Record<string, any> | FilterCallback): void;
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
interface RowData extends Row {
    _metadata: RowMetadata;
}
interface RowMetadata {
    index: number;
    searchScore?: number;
    tokens: Record<string, string[]>;
    sortValues: Record<string, any>;
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

export { type CellFormatterCallback, type ColumnFilterCallback, type ColumnOptions, type ColumnState, type ComparatorCallback, DataTable, type FilterCallback, LocalStorageAdapter, type Row, type RowFormatterCallback, type SortOrder, type SortValueCallback, type TableClasses, type TableOptions, type TokenizerCallback, type ValueFormatterCallback };
