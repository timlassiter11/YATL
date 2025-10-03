import { LocalStorageAdapter } from '../local-storage-adapter';
import type { TableState } from '../../../data-table/types';

// Mock the global localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Create a mock DataTable class that we can control
class MockDataTable<T extends object> extends EventTarget {
  state: TableState<T>;
  constructor(initialState: TableState<T>) {
    super();
    this.state = initialState;
  }
  getState = jest.fn(() => this.state);
  restoreState = jest.fn();
}

describe('LocalStorageAdapter', () => {
  type SampleData = { id: number; name: string };
  const storageKey = 'test-table-state';
  let mockDataTable: MockDataTable<SampleData>;

  const tableState: TableState<SampleData> = {
    searchQuery: 'Alice',
    scrollPosition: { top: 100, left: 0 },
    columnOrder: ['name', 'id'],
    filters: null,
    columns: [
      {
        field: 'id',
        visible: true,
        width: 50,
        sortState: null,
      },
      {
        field: 'name',
        visible: false,
        width: 150,
        sortState: { order: 'asc', priority: 1 },
      },
    ],
  };

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    mockDataTable = new MockDataTable(tableState);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Constructor and Initialization', () => {
    it('should restore state from localStorage on initialization', () => {
      localStorageMock.setItem(
        storageKey,
        JSON.stringify({ searchQuery: 'Bob' }),
      );
      new LocalStorageAdapter(mockDataTable, storageKey);
      expect(mockDataTable.restoreState).toHaveBeenCalledWith({
        searchQuery: 'Bob',
      });
    });

    it('should attach event listeners based on default options', () => {
      const addListenerSpy = jest.spyOn(mockDataTable, 'addEventListener');
      new LocalStorageAdapter(mockDataTable, storageKey);
      expect(addListenerSpy).toHaveBeenCalledWith(
        'dt.search',
        expect.any(Function),
      );
      expect(addListenerSpy).toHaveBeenCalledWith(
        'dt.col.sort',
        expect.any(Function),
      );
      expect(addListenerSpy).toHaveBeenCalledWith(
        'dt.col.visibility',
        expect.any(Function),
      );
      expect(addListenerSpy).toHaveBeenCalledWith(
        'dt.col.resize',
        expect.any(Function),
      );
      expect(addListenerSpy).toHaveBeenCalledWith(
        'dt.col.reorder',
        expect.any(Function),
      );
    });

    it('should NOT attach listeners if options are disabled', () => {
      const addListenerSpy = jest.spyOn(mockDataTable, 'addEventListener');
      new LocalStorageAdapter(mockDataTable, storageKey, {
        saveColumnSorting: false,
        saveColumnWidth: false,
      });
      expect(addListenerSpy).not.toHaveBeenCalledWith(
        'dt.col.sort',
        expect.any(Function),
      );
      expect(addListenerSpy).toHaveBeenCalledWith(
        'dt.col.visibility',
        expect.any(Function),
      );
      expect(addListenerSpy).not.toHaveBeenCalledWith(
        'dt.col.resize',
        expect.any(Function),
      );
    });
  });

  describe('saveState', () => {
    it('should save the full state when all options are enabled', () => {
      const adapter = new LocalStorageAdapter(mockDataTable, storageKey);
      adapter.saveState();
      const savedJSON = localStorageMock.getItem(storageKey);
      expect(savedJSON).not.toBeNull();
      const savedState = JSON.parse(savedJSON!);
      expect(savedState.searchQuery).toBe('Alice');
      expect(savedState.columns[1].visible).toBe(false);
    });

    it('should save only specified properties when options are disabled', () => {
      const adapter = new LocalStorageAdapter(mockDataTable, storageKey, {
        saveSearch: false,
        saveColumnVisibility: false,
        saveColumnWidth: true,
      });
      adapter.saveState();
      const savedState = JSON.parse(localStorageMock.getItem(storageKey)!);

      expect(savedState.searchQuery).toBeUndefined();
      expect(savedState.columns[0].visible).toBeUndefined();

      expect(savedState.columns[0].width).toBe(50);
    });
  });

  describe('restoreState', () => {
    it('should call dataTable.restoreState with the filtered state', () => {
      localStorageMock.setItem(storageKey, JSON.stringify(tableState));
      new LocalStorageAdapter(mockDataTable, storageKey, {
        saveSearch: true,
        saveColumnVisibility: false,
      });

      // restoreState is called in the constructor, so we check the mock
      const restoredState = mockDataTable.restoreState.mock
        .calls[0][0] as TableState<object>;
      expect(restoredState.searchQuery).toBe('Alice');
      // Visibility should have been deleted from the column state before restoring
      expect(restoredState.columns![0].visible).toBeUndefined();
    });

    it('should not do anything if no state is in localStorage', () => {
      new LocalStorageAdapter(mockDataTable, storageKey);
      expect(mockDataTable.restoreState).not.toHaveBeenCalled();
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorageMock.setItem(storageKey, '{"bad json":,');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      new LocalStorageAdapter(mockDataTable, storageKey);
      expect(mockDataTable.restoreState).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearState', () => {
    it('should remove the item from localStorage', () => {
      localStorageMock.setItem(storageKey, '{"test":1}');
      const adapter = new LocalStorageAdapter(mockDataTable, storageKey);
      adapter.clearState();
      expect(localStorageMock.getItem(storageKey)).toBeNull();
    });
  });

  describe('Event Handling', () => {
    it('should call saveState after an event is dispatched', () => {
      const adapter = new LocalStorageAdapter(mockDataTable, storageKey);
      const saveSpy = jest.spyOn(adapter, 'saveState');

      // Dispatch a mock event
      mockDataTable.dispatchEvent(new CustomEvent('dt.col.sort'));

      // saveState should not be called synchronously due to setTimeout
      expect(saveSpy).not.toHaveBeenCalled();

      // Fast-forward timers to execute the setTimeout callback
      jest.runAllTimers();

      expect(saveSpy).toHaveBeenCalledTimes(1);
    });
  });
});
