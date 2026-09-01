import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { YatlTableController } from './table-controller';
import { YatlTableCommitEvent } from '../events';
import type { StorageInterface } from '../types';

interface Row {
  id: number;
  name: string;
  age: number;
}

const getData = (): Row[] => [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
];

function createController(data: Row[] = getData()) {
  const controller = new YatlTableController<Row>();
  controller.rowIdCallback = row => row.id;
  controller.columns = [{ field: 'id' }, { field: 'name' }, { field: 'age' }];
  controller.data = data;
  return controller;
}

function createEditableController(data: Row[] = getData()) {
  const controller = new YatlTableController<Row>();
  controller.rowIdCallback = row => row.id;
  controller.columns = [
    { field: 'id' },
    { field: 'name', editor: { canEdit: () => true, render: () => null } },
    { field: 'age' },
  ];
  controller.data = data;
  return controller;
}

describe('YatlTableController - commit/edit lifecycle', () => {
  test('commitChanges applies the value and clears the pending edit', () => {
    const controller = createController();
    const [alice] = controller.data;

    controller.setPendingValue(alice, 'name', 'Alicia');
    expect(controller.getCellStatus(alice, 'name')).toBe('dirty');

    controller.commitChanges(alice, 'name');

    expect(controller.getCellStatus(alice, 'name')).toBe('clean');
    expect(controller.getLatestValue(alice, 'name')).toBe('Alicia');
    expect(controller.getRow(controller.getRowId(alice))!.name).toBe('Alicia');
  });

  test('getLatestValue returns an explicit undefined pending edit instead of falling back to the row value', () => {
    const controller = createController();
    const [alice] = controller.data; // name: 'Alice'

    controller.setPendingValue(alice, 'name', undefined);

    expect(controller.getCellStatus(alice, 'name')).toBe('dirty');
    expect(controller.getLatestValue(alice, 'name')).toBeUndefined();
  });

  test('commitChanges applies an explicit undefined pending edit to the row', () => {
    const controller = createController();
    const [alice] = controller.data;

    controller.setPendingValue(alice, 'name', undefined);
    controller.commitChanges(alice, 'name');

    expect(controller.getCellStatus(alice, 'name')).toBe('clean');
    expect(alice.name).toBeUndefined();
  });

  test('commitChanges only clears the committed field, leaving other pending edits on the row intact', () => {
    const controller = createController();
    const [alice] = controller.data;

    controller.setPendingValue(alice, 'name', 'Alicia');
    controller.setPendingValue(alice, 'age', 31);

    controller.commitChanges(alice, 'name');

    // 'age' is still pending - the row still has an outstanding edit and
    // should still show up as such.
    expect(controller.getCellStatus(alice, 'age')).toBe('dirty');
    expect(controller.getPendingChanges()).toEqual([
      expect.objectContaining({
        rowId: controller.getRowId(alice),
        changedFields: ['age'],
      }),
    ]);
  });

  test('commitAllChanges clears every pending edit, not just editedRows membership', async () => {
    const controller = createController();
    const [alice, bob] = controller.data;

    controller.setPendingValue(alice, 'name', 'Alicia');
    controller.setPendingValue(bob, 'age', 26);

    await controller.commitAllChanges();

    expect(controller.getCellStatus(alice, 'name')).toBe('clean');
    expect(controller.getCellStatus(bob, 'age')).toBe('clean');
    expect(controller.getPendingChanges()).toEqual([]);
  });

  test('revertPendingChanges clears editedRows, not just pendingEdits', async () => {
    const controller = createController();
    const [alice] = controller.data;

    controller.setPendingValue(alice, 'name', 'Alicia');
    await controller.revertPendingChanges();

    expect(controller.getCellStatus(alice, 'name')).toBe('clean');
    // pendingEdits alone doesn't capture all of the bookkeeping here -
    // editedRows must also be cleared, or it leaks a stale entry forever.
    // There's no public way to observe this leak, so we reach into the
    // private field directly.
    expect(
      (controller as unknown as { editedRows: Set<unknown> }).editedRows.size,
    ).toBe(0);
  });

  test('commitChanges refreshes the cached sort value for the committed field', () => {
    const controller = createController();
    const [alice] = controller.data; // Alice: 30, Bob: 25

    controller.sort('age', 'asc');
    expect(controller.filteredData.map(r => r.name)).toEqual(['Bob', 'Alice']);

    controller.setPendingValue(alice, 'age', 10);
    controller.commitChanges(alice, 'age');

    // Alice is now the youngest, so ascending order should put her first -
    // if the cached sort value wasn't refreshed, she'd stay stuck in place.
    expect(controller.filteredData.map(r => r.name)).toEqual(['Alice', 'Bob']);
  });
});

describe('YatlTableController - pending edits across a data reload', () => {
  test('a pending edit survives a data reload for a row with an unchanged id', () => {
    const controller = createController();
    const [alice] = controller.data; // id: 1, name: 'Alice', age: 30

    controller.setPendingValue(alice, 'name', 'Alicia (editing)');
    expect(controller.getCellStatus(alice, 'name')).toBe('dirty');

    // Simulate a periodic background reload: brand new row objects, but
    // the same logical rows (same ids) - e.g. the age changed server-side.
    controller.data = [
      { id: 1, name: 'Alice', age: 31 },
      { id: 2, name: 'Bob', age: 25 },
    ];

    const reloadedAlice = controller.getRow(1)!;
    expect(reloadedAlice).not.toBe(alice); // a genuinely new row object

    // The pending edit should still be there, shadowing the reloaded value.
    expect(controller.getCellStatus(reloadedAlice, 'name')).toBe('dirty');
    expect(controller.getLatestValue(reloadedAlice, 'name')).toBe(
      'Alicia (editing)',
    );
    // Fields with no pending edit should reflect the freshly reloaded data.
    expect(controller.getLatestValue(reloadedAlice, 'age')).toBe(31);

    // And committing afterwards should apply to the *new* row object.
    controller.commitChanges(reloadedAlice, 'name');
    expect(reloadedAlice.name).toBe('Alicia (editing)');
  });

  test('commitAllChanges does not throw when an edited row disappears in a reload, and still commits the rest', async () => {
    const controller = createController();
    const [alice, bob] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia (editing)');
    controller.setPendingValue(bob, 'name', 'Bobby (editing)');

    // Alice is gone entirely in the next reload (e.g. deleted server-side).
    controller.data = [{ id: 2, name: 'Bob', age: 25 }];
    const reloadedBob = controller.getRow(2)!;

    await expect(controller.commitAllChanges()).resolves.not.toThrow();

    // Bob's edit, still valid, should have gone through normally.
    expect(reloadedBob.name).toBe('Bobby (editing)');
    expect(controller.getCellStatus(reloadedBob, 'name')).toBe('clean');
  });

  test('revertPendingChanges does not throw when an edited row disappears in a reload', async () => {
    const controller = createController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia (editing)');

    controller.data = [{ id: 2, name: 'Bob', age: 25 }];

    await expect(controller.revertPendingChanges()).resolves.not.toThrow();
  });

  test('a selected row is dropped from selectedRowIds when it disappears in a reload', () => {
    const controller = createController();
    controller.rowSelectionMethod = 'multi';
    const [alice] = controller.data;

    controller.selectRow(alice);
    expect(controller.selectedRowIds).toEqual([1]);

    controller.data = [{ id: 2, name: 'Bob', age: 25 }];

    expect(controller.selectedRowIds).toEqual([]);
  });
});

describe('YatlTableController - commit transactions', () => {
  test('createCommitTransaction returns null when there are no pending edits', () => {
    const controller = createController();
    expect(controller.createCommitTransaction()).toBeNull();
  });

  test('createCommitTransaction captures pending edits and marks the row as saving', () => {
    const controller = createEditableController();
    const [alice] = controller.data;

    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction();

    expect(transaction).not.toBeNull();
    expect(transaction!.records).toEqual([
      expect.objectContaining({
        rowId: 1,
        changedFields: ['name'],
        changes: { name: 'Alicia' },
        mergedRow: { id: 1, name: 'Alicia', age: 30 },
      }),
    ]);
    expect(controller.getCellStatus(alice, 'name')).toBe('saving');
    expect(controller.isCellEditable(alice, 'name')).toBe(false);
    // Mid-transaction rows are "saving", not "pending" - they shouldn't
    // show up as outstanding changes.
    expect(controller.getPendingChanges()).toEqual([]);
  });

  test('resolveTransaction applies the change, clears the status, and fires the commit event', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;

    const spy = vi.fn();
    controller.addEventListener('yatl-table-commit', spy);

    controller.resolveTransaction(transaction.id);

    expect(alice.name).toBe('Alicia');
    expect(controller.getCellStatus(alice, 'name')).toBe('clean');
    expect(spy).toHaveBeenCalledOnce();
    const event = spy.mock.calls[0][0] as YatlTableCommitEvent<Row>;
    expect(event.action).toBe('resolve');
    expect(event.transaction.id).toBe(transaction.id);
  });

  test('rejectTransaction restores the edit as pending, without applying it', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;

    controller.rejectTransaction(transaction.id);

    expect(alice.name).toBe('Alice');
    expect(controller.getCellStatus(alice, 'name')).toBe('dirty');
    expect(controller.getLatestValue(alice, 'name')).toBe('Alicia');
  });

  test('rejectTransaction does not clobber a newer pending edit made while the transaction was in flight', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;

    // A new edit happens while the first one is still "saving".
    controller.setPendingValue(alice, 'name', 'Alicia V2');

    controller.rejectTransaction(transaction.id);

    expect(controller.getLatestValue(alice, 'name')).toBe('Alicia V2');
  });

  test('discardTransaction drops the edit entirely - no restore, no apply', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;

    controller.discardTransaction(transaction.id);

    expect(alice.name).toBe('Alice');
    expect(controller.getCellStatus(alice, 'name')).toBe('clean');
    expect(controller.getLatestValue(alice, 'name')).toBe('Alice');
  });

  test('closing an unknown transaction id throws', () => {
    const controller = createController();
    expect(() => controller.resolveTransaction('does-not-exist')).toThrow();
  });

  test('closing an already-closed transaction id throws', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;
    controller.resolveTransaction(transaction.id);

    expect(() => controller.resolveTransaction(transaction.id)).toThrow();
  });
});

describe('YatlTableController - transactions across a data reload', () => {
  test('resolveTransaction does not throw when the row disappeared during the transaction', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;

    controller.data = [{ id: 2, name: 'Bob', age: 25 }]; // Alice is gone

    expect(() => controller.resolveTransaction(transaction.id)).not.toThrow();
  });

  test('rejectTransaction does not throw when the row disappeared during the transaction', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;

    controller.data = [{ id: 2, name: 'Bob', age: 25 }];

    expect(() => controller.rejectTransaction(transaction.id)).not.toThrow();
  });

  test('discardTransaction does not throw when the row disappeared during the transaction', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;

    controller.data = [{ id: 2, name: 'Bob', age: 25 }];

    expect(() => controller.discardTransaction(transaction.id)).not.toThrow();
  });

  test('a transaction for a still-present row resolves normally even if a different row vanished', () => {
    const controller = createEditableController();
    const [alice, bob] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    controller.setPendingValue(bob, 'name', 'Bobby');
    const transaction = controller.createCommitTransaction()!;
    expect(transaction.records).toHaveLength(2);

    // Bob disappears, but Alice is still there.
    controller.data = [{ id: 1, name: 'Alice', age: 30 }];
    const reloadedAlice = controller.getRow(1)!;

    controller.resolveTransaction(transaction.id);

    expect(reloadedAlice.name).toBe('Alicia');
  });
});

function createMemoryStorage(): StorageInterface & {
  store: Map<string, string>;
} {
  const store = new Map<string, string>();
  return {
    store,
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
}

describe('YatlTableController - storage persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('debounces multiple rapid changes into a single save', () => {
    const storage = createMemoryStorage();
    const setItemSpy = vi.spyOn(storage, 'setItem');
    const controller = createController();
    controller.storageOptions = { key: 'test', storage };

    controller.searchQuery = 'a';
    controller.searchQuery = 'ab';
    controller.searchQuery = 'abc';
    vi.advanceTimersByTime(1000);

    expect(setItemSpy).toHaveBeenCalledOnce();
  });

  test('only saves the categories enabled by their save* flag', () => {
    const storage = createMemoryStorage();
    const controller = createController();
    controller.storageOptions = {
      key: 'test',
      storage,
      saveSearchQuery: true,
      saveSelectedRows: false,
      saveColumnOrder: false,
    };

    controller.searchQuery = 'alice';
    controller.rowSelectionMethod = 'multi';
    controller.selectRow(controller.data[0]);
    vi.advanceTimersByTime(1000);

    const saved = JSON.parse(storage.store.get('test')!);
    expect(saved.searchQuery).toBe('alice');
    expect(saved.selectedRows).toBeUndefined();
    expect(saved.columnOrder).toBeUndefined();
  });

  test('saveSearchQuery defaults to off, unlike the other save flags', () => {
    const storage = createMemoryStorage();
    const controller = createController();
    // No saveSearchQuery flag at all - only column-related flags default on.
    controller.storageOptions = { key: 'test', storage };

    controller.searchQuery = 'alice';
    vi.advanceTimersByTime(1000);

    const saved = JSON.parse(storage.store.get('test')!);
    expect(saved.searchQuery).toBeUndefined();
  });

  test('only saves the per-column categories enabled by their save* flag', () => {
    const storage = createMemoryStorage();
    const controller = createController();
    controller.storageOptions = {
      key: 'test',
      storage,
      saveColumnVisibility: true,
      saveColumnWidths: false,
      saveColumnSortOrders: false,
      saveColumnStickyPositions: false,
    };

    controller.hideColumn('age');
    controller.resizeColumn('name', 150);
    controller.sort('name', 'asc');
    vi.advanceTimersByTime(1000);

    const saved = JSON.parse(storage.store.get('test')!);
    const ageColumn = saved.columns.find(
      (c: { field: string }) => c.field === 'age',
    );
    expect(ageColumn.visible).toBe(false);
    expect(ageColumn.width).toBeUndefined();
    expect(ageColumn.sort).toBeUndefined();
    expect(ageColumn.stickyPosition).toBeUndefined();
  });

  test('loading restores only the categories enabled by their save* flag', () => {
    const storage = createMemoryStorage();
    storage.store.set(
      'test',
      JSON.stringify({
        searchQuery: 'from storage',
        selectedRows: [1],
        columns: [],
      }),
    );

    const controller = createController();
    // Only opt in to restoring the search query, not selection.
    controller.storageOptions = {
      key: 'test',
      storage,
      saveSearchQuery: true,
      saveSelectedRows: false,
    };

    expect(controller.searchQuery).toBe('from storage');
    expect(controller.selectedRowIds).toEqual([]);
  });

  test('a saved state round-trips through a new controller instance', () => {
    const storage = createMemoryStorage();
    const first = createController();
    first.storageOptions = { key: 'test', storage, saveSearchQuery: true };
    first.hideColumn('age');
    first.sort('name', 'asc');
    first.searchQuery = 'alice';
    vi.advanceTimersByTime(1000);

    const second = createController();
    second.storageOptions = { key: 'test', storage, saveSearchQuery: true };

    expect(second.searchQuery).toBe('alice');
    expect(second.getColumnState('age').visible).toBe(false);
    expect(second.getColumnState('name').sort).toEqual({
      order: 'asc',
      priority: expect.any(Number),
    });
  });

  test('does not crash and leaves default state when the stored value is corrupt JSON', () => {
    const storage = createMemoryStorage();
    storage.store.set('test', '{not valid json');

    const controller = createController();
    expect(() => {
      controller.storageOptions = {
        key: 'test',
        storage,
        saveSearchQuery: true,
      };
    }).not.toThrow();

    expect(controller.searchQuery).toBe('');
  });

  test('does not crash when the underlying storage throws on write', () => {
    const storage = createMemoryStorage();
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const controller = createController();
    controller.storageOptions = { key: 'test', storage };

    controller.searchQuery = 'alice';
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });
});
