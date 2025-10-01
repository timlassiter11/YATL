import { DataTable } from '../data-table/data-table';
import {
  RestorableColumnState,
  RestorableTableState,
} from '../data-table/types';

interface Options {
  saveSearch: boolean;
  saveScrollPosition: boolean;
  saveColumnTitle: boolean;
  saveColumnSorting: boolean;
  saveColumnOrder: boolean;
  saveColumnVisibility: boolean;
  saveColumnWidth: boolean;
}

/**
 * Monitors a {@link DataTable} instance for changes and saves the state to local storage.
 */
export class LocalStorageAdapter<T extends object> {
  #dataTable: DataTable<T>;
  #storageKey: string;
  #options: Options = {
    saveSearch: true,
    saveScrollPosition: true,
    saveColumnTitle: true,
    saveColumnSorting: true,
    saveColumnVisibility: true,
    saveColumnWidth: true,
    saveColumnOrder: true,
  };

  /**
   * @param dataTable - The DataTable instance to monitor.
   * @param storageKey - The key to use for saving the state in localStorage.
   * @param options - The options for configuring what is stored.
   */
  constructor(dataTable: DataTable<T>, storageKey: string, options?: Options) {
    this.#dataTable = dataTable;
    this.#storageKey = storageKey;
    this.#options = { ...this.#options, ...options };

    // Restore state before adding the listeners.
    this.restoreState();

    if (this.#options.saveColumnSorting) {
      dataTable.addEventListener('dt.col.sort', this.#saveStateAfterEvent);
    }

    if (this.#options.saveColumnVisibility) {
      dataTable.addEventListener(
        'dt.col.visibility',
        this.#saveStateAfterEvent,
      );
    }

    if (this.#options.saveColumnWidth) {
      dataTable.addEventListener('dt.col.resize', this.#saveStateAfterEvent);
    }

    if (this.#options.saveColumnOrder) {
      dataTable.addEventListener('dt.col.reorder', this.#saveStateAfterEvent);
    }
  }

  /**
   * Saves the current column state to localStorage.
   */
  saveState() {
    const savedTableState: RestorableTableState<T> = {
      columns: [],
    };
    const tableState = this.#dataTable.getState();

    if (this.#options.saveSearch) {
      savedTableState.searchQuery = tableState.searchQuery;
    }

    if (this.#options.saveScrollPosition) {
      savedTableState.scrollPosition = tableState.scrollPosition;
    }

    if (this.#options.saveColumnOrder) {
      savedTableState.columnOrder = tableState.columnOrder;
    }

    for (const columnState of tableState.columns) {
      const savedColumnState: RestorableColumnState<T> = {
        field: columnState.field,
      };

      if (this.#options.saveColumnTitle) {
        savedColumnState.title = columnState.title;
      }

      if (this.#options.saveColumnSorting) {
        savedColumnState.sortState = columnState.sortState;
      }

      if (this.#options.saveColumnVisibility) {
        savedColumnState.visible = columnState.visible;
      }

      if (this.#options.saveColumnWidth) {
        savedColumnState.width = columnState.width;
      }

      savedTableState.columns?.push(savedColumnState);
    }

    localStorage.setItem(this.#storageKey, JSON.stringify(savedTableState));
  }

  /**
   * Restores the column state from localStorage.
   */
  restoreState() {
    const json = localStorage.getItem(this.#storageKey);
    if (!json) {
      return;
    }

    try {
      const savedTableState = JSON.parse(json) as RestorableTableState<T>;

      if (!this.#options.saveSearch) {
        delete savedTableState.searchQuery;
      }
      if (!this.#options.saveScrollPosition) {
        delete savedTableState.scrollPosition;
      }

      if (!this.#options.saveColumnOrder) {
        delete savedTableState.columnOrder;
      }

      if (savedTableState.columns) {
        for (const columnState of savedTableState.columns) {
          if (!this.#options.saveColumnTitle) {
            delete columnState.title;
          }

          if (!this.#options.saveColumnVisibility) {
            delete columnState.visible;
          }

          if (!this.#options.saveColumnWidth) {
            delete columnState.width;
          }

          if (!this.#options.saveColumnSorting) {
            delete columnState.sortState;
          }
        }
      }

      console.log(savedTableState);
      this.#dataTable.restoreState(savedTableState);
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

  #saveStateAfterEvent = () => setTimeout(() => this.saveState(), 0);
}
