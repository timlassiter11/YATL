import { DataTable } from "../datatable.js";

/**
 * @typedef {object} Options
 * @property {string} saveColumnSorting - Whether to save sorting state. Default is true.
 * @property {string} saveColumnOrder - Whether to save column order. Default is true.
 * @property {string} saveColumnVisibility - Whether to save column visibility. Default is true.
 * @property {string} saveColumnWidth - Whether to save column width. Default is true.
 */

export class LocalStorageAdapter {
    /** @type {DataTable} */
    #dataTable;
    /** @type {string} */
    #storageKey;
    /** @type {Options} */
    #options = {
        saveColumnSorting: true,
        saveColumnVisibility: true,        
        saveColumnWidth: true,
        saveColumnOrder: true,
    }

    /**
     * @param {DataTable} dataTable - The DataTable instance to monitor.
     * @param {string} storageKey - The key to use for saving the state in localStorage.
     * @param {Options} options - The key to use for saving the state in localStorage.
     */
    constructor(dataTable, storageKey, options = {}) {
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
        const columnStates = this.#dataTable.columns.map((col) => ({
            field: col.field,
            sortOrder: col.sortOrder,
            sortPriority: col.sortPriority,
            visible: col.visible,
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

            columnStates.forEach((savedCol) => {
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
                this.#dataTable.setColumnOrder(columnStates.map((col) => col.field));
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