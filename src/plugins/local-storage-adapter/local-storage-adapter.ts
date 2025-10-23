import {
  RestorableColumnState,
  RestorableTableState,
} from '../../data-table/types';
import { IDataTable, LocalStorageAdapterOptions } from './types';

const DEFAULT_OPTIONS: Required<LocalStorageAdapterOptions> = {
    saveSearch: true,
    saveColumnSorting: true,
    saveColumnVisibility: true,
    saveColumnWidth: true,
    saveColumnOrder: true,
  };

/**
 * Monitors a {@link DataTable} instance for changes and saves the state to local storage.
 */
export class LocalStorageAdapter<T> {
  private options: Required<LocalStorageAdapterOptions>;

  /**
   * @param dataTable - The DataTable instance to monitor.
   * @param storageKey - The key to use for saving the state in localStorage.
   * @param options - The options for configuring what is stored.
   */
  constructor(
    private readonly storageKey: string,
    private dataTable?: IDataTable<T>,
    options?: LocalStorageAdapterOptions,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    if (dataTable) {
      this.setDataTable(dataTable);
    }
  }

  setDataTable(dataTable: IDataTable<T>) {
    // Clear old event listeners
    this.destroy();

    this.dataTable = dataTable;
    // Restore state before adding the listeners.
    this.restoreState();

    if (this.options.saveSearch) {
      dataTable.addEventListener('dt.search', this.#saveStateAfterEvent);
    }

    if (this.options.saveColumnSorting) {
      dataTable.addEventListener('dt.col.sort', this.#saveStateAfterEvent);
    }

    if (this.options.saveColumnVisibility) {
      dataTable.addEventListener(
        'dt.col.visibility',
        this.#saveStateAfterEvent,
      );
    }

    if (this.options.saveColumnWidth) {
      dataTable.addEventListener('dt.col.resize', this.#saveStateAfterEvent);
    }

    if (this.options.saveColumnOrder) {
      dataTable.addEventListener('dt.col.reorder', this.#saveStateAfterEvent);
    }
  }

  destroy() {
    this.dataTable?.removeEventListener('dt.search', this.#saveStateAfterEvent);
    this.dataTable?.removeEventListener('dt.col.sort', this.#saveStateAfterEvent);
    this.dataTable?.removeEventListener(
      'dt.col.visibility',
      this.#saveStateAfterEvent,
    );

    this.dataTable?.removeEventListener(
      'dt.col.resize',
      this.#saveStateAfterEvent,
    );
    this.dataTable?.removeEventListener(
      'dt.col.reorder',
      this.#saveStateAfterEvent,
    );
    this.dataTable = undefined;
  }

  /**
   * Saves the current column state to localStorage.
   */
  saveState() {
    if (!this.dataTable) {
      return;
    }

    const savedTableState: RestorableTableState<T> = {
      columns: [],
    };
    const tableState = this.dataTable.getState();

    if (this.options.saveSearch) {
      savedTableState.searchQuery = tableState.searchQuery;
    }

    if (this.options.saveColumnOrder) {
      savedTableState.columnOrder = tableState.columnOrder;
    }

    for (const columnState of tableState.columns) {
      const savedColumnState: RestorableColumnState<T> = {
        field: columnState.field,
      };

      if (this.options.saveColumnSorting) {
        savedColumnState.sortState = columnState.sortState;
      }

      if (this.options.saveColumnVisibility) {
        savedColumnState.visible = columnState.visible;
      }

      if (this.options.saveColumnWidth) {
        savedColumnState.width = columnState.width;
      }

      savedTableState.columns?.push(savedColumnState);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(savedTableState));
  }

  /**
   * Restores the column state from localStorage.
   */
  restoreState() {
    if (!this.dataTable) {
      return;
    }

    const json = localStorage.getItem(this.storageKey);
    if (!json) {
      return;
    }

    try {
      const savedTableState = JSON.parse(json) as RestorableTableState<T>;
      const tableStateToRestore: RestorableTableState<T> = {};

      if (this.options.saveSearch) {
        tableStateToRestore.searchQuery = savedTableState.searchQuery;
      }

      if (this.options.saveColumnOrder) {
        tableStateToRestore.columnOrder = savedTableState.columnOrder;
      }

      if (savedTableState.columns) {
        tableStateToRestore.columns = [];
        for (const savedColumnState of savedTableState.columns) {
          const columnStateToRestore: RestorableColumnState<T> = {
            field: savedColumnState.field,
          };

          if (this.options.saveColumnVisibility) {
            columnStateToRestore.visible = savedColumnState.visible;
          }

          if (this.options.saveColumnWidth) {
            columnStateToRestore.width = savedColumnState.width;
          }

          if (this.options.saveColumnSorting) {
            columnStateToRestore.sortState = savedColumnState.sortState;
          }
          tableStateToRestore.columns.push(columnStateToRestore);
        }
      }

      this.dataTable.restoreState(tableStateToRestore);
    } catch (error) {
      console.error('Failed to restore DataTable state:', error);
    }
  }

  /**
   * Clears the saved state from localStorage.
   */
  clearState() {
    localStorage.removeItem(this.storageKey);
  }

  #saveStateAfterEvent = () => setTimeout(() => this.saveState(), 0);
}
