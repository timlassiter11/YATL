import { DataTable } from '../datatable';
import { ColumnState } from '../types';

interface Options {
  saveColumnSorting: boolean;
  saveColumnOrder: boolean;
  saveColumnVisibility: boolean;
  saveColumnWidth: boolean;
}

export class LocalStorageAdapter {
  #dataTable: DataTable;
  #storageKey: string;
  #options: Options = {
    saveColumnSorting: true,
    saveColumnVisibility: true,
    saveColumnWidth: true,
    saveColumnOrder: true,
  };

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

    if (this.#options.saveColumnSorting) {
      dataTable.addEventListener('dt.col.sort', () => this.saveState());
    }

    if (this.#options.saveColumnVisibility) {
      dataTable.addEventListener('dt.col.visibility', () => this.saveState());
    }

    if (this.#options.saveColumnWidth) {
      dataTable.addEventListener('dt.col.resize', () => this.saveState());
    }

    if (this.#options.saveColumnOrder) {
      dataTable.addEventListener('dt.col.reorder', () => this.saveState());
    }
  }

  /**
   * Saves the current column state to localStorage.
   */
  saveState() {
    const states: Partial<ColumnState>[] = this.#dataTable.columnStates;
    for (const state of states) {
      if (!this.#options.saveColumnSorting) {
        state.sortOrder = undefined;
        state.sortPriority = undefined;
      }

      if (!this.#options.saveColumnVisibility) {
        state.visible = undefined;
      }

      if (!this.#options.saveColumnWidth) {
        state.width = undefined;
      }
    }

    localStorage.setItem(
      this.#storageKey,
      JSON.stringify(this.#dataTable.columnStates),
    );
  }

  /**
   * Restores the column state from localStorage.
   */
  restoreState() {
    const savedState = localStorage.getItem(this.#storageKey);
    if (!savedState) return;

    try {
      const columnStates = JSON.parse(savedState) as ColumnState[];
      this.#dataTable.columnStates = columnStates;

      if (this.#options.saveColumnOrder) {
        this.#dataTable.setColumnOrder(
          columnStates.map((col: ColumnState) => col.field),
        );
      }
    } catch (error) {
      console.error('Failed to restore DataTable state:', error);
    }
  }

  /**
   * Clears the saved state from localStorage.
   */
  clearState() {
    localStorage.removeItem(this.#storageKey);
  }
}
