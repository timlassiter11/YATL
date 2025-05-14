import { ColumnData, DataTable, SortOrder } from "../datatable";

interface Options {
    saveColumnSorting: boolean;
    saveColumnOrder: boolean;
    saveColumnVisibility: boolean;
    saveColumnWidth: boolean;
}

interface ColumnState {
    field: string;
    sortOrder: SortOrder;
    sortPriority?: number;
    visible: boolean;
    width: string;
}

export class LocalStorageAdapter {
    #dataTable: DataTable;
    #storageKey: string;
    #options: Options = {
        saveColumnSorting: true,
        saveColumnVisibility: true,        
        saveColumnWidth: true,
        saveColumnOrder: true,
    }

    /**
     * @param dataTable - The DataTable instance to monitor.
     * @param storageKey - The key to use for saving the state in localStorage.
     * @param options - The key to use for saving the state in localStorage.
     */
    constructor(dataTable: DataTable, storageKey: string, options?: Options) {
        this.#dataTable = dataTable;
        this.#storageKey = storageKey;
        this.#options = { ...this.#options, ...options };

        // Restore state before adding the listeners.
        this.restoreState();

        const table = dataTable.table;

        if (this.#options.saveColumnSorting) {
            table.addEventListener(DataTable.Events.COL_SORT, () => this.saveState());
        }

        if (this.#options.saveColumnVisibility) {
            table.addEventListener(DataTable.Events.COL_HIDE, () => this.saveState());
            table.addEventListener(DataTable.Events.COL_SHOW, () => this.saveState());
        }

        if (this.#options.saveColumnWidth) {
            table.addEventListener(DataTable.Events.COL_RESIZE, () => this.saveState());
        }

        if (this.#options.saveColumnOrder) {
            table.addEventListener(DataTable.Events.COL_REARRANGE, () => this.saveState());
        }
    }

    /**
     * Saves the current column state to localStorage.
     */
    saveState() {
        const columnStates = this.#dataTable.columns.map((col): ColumnState => ({
            field: col.field,
            sortOrder: col.sortOrder,
            sortPriority: col.sortPriority,
            visible: !col.element.hidden,
            width: col.element.style.width,
        }));

        localStorage.setItem(this.#storageKey, JSON.stringify(columnStates));
    }

    /**
     * Restores the column state from localStorage.
     */
    restoreState() {
        const savedState = localStorage.getItem(this.#storageKey);
        if (!savedState) return;

        try {
            const columnStates = JSON.parse(savedState);
            const columns = this.#dataTable.columns;

            columnStates.forEach((savedCol: ColumnState) => {
                const col = columns.find((c) => c.field === savedCol.field);
                if (col) {
                    
                    if (this.#options.saveColumnSorting) {
                        col.sortOrder = savedCol.sortOrder;
                        col.sortPriority = savedCol.sortPriority;
                    }

                    if (this.#options.saveColumnVisibility) {
                        this.#dataTable.setColumnVisibility(col.field, savedCol.visible);
                    }

                    if (this.#options.saveColumnWidth) {
                        col.element.style.width = savedCol.width;
                    }
                }
            });

            if (this.#options.saveColumnOrder) {
                this.#dataTable.setColumnOrder(columnStates.map((col: ColumnState) => col.field));
            }

            this.#dataTable.refresh();

        } catch (error) {
            console.error("Failed to restore DataTable state:", error);
        }
    }

    /**
     * Clears the saved state from localStorage.
     */
    clearState() {
        localStorage.removeItem(this.#storageKey);
    }
}