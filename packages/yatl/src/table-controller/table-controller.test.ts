import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { YatlTableController } from './table-controller';
import { YatlTableCommitEvent, YatlTablePendingChangeEvent } from '../events';
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

describe('YatlTableController - yatl-table-pending-change', () => {
  test('fires when a field transitions from clean to dirty', () => {
    const controller = createController();
    const [alice] = controller.data;
    const spy = vi.fn();
    controller.addEventListener('yatl-table-pending-change', spy);

    controller.setPendingValue(alice, 'name', 'Alicia');

    expect(spy).toHaveBeenCalledOnce();
    const event = spy.mock.calls[0][0] as YatlTablePendingChangeEvent<Row>;
    expect(event.changes).toEqual([
      expect.objectContaining({ rowId: 1, changedFields: ['name'] }),
    ]);
  });

  test('does not fire again for a second edit that keeps the field dirty', () => {
    const controller = createController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const spy = vi.fn();
    controller.addEventListener('yatl-table-pending-change', spy);

    controller.setPendingValue(alice, 'name', 'Alicia V2');

    expect(spy).not.toHaveBeenCalled();
  });

  test('fires when editing a field back to its original value drops it out of the pending count', () => {
    const controller = createController();
    const [alice] = controller.data; // name: 'Alice'
    controller.setPendingValue(alice, 'name', 'Alicia');
    const spy = vi.fn();
    controller.addEventListener('yatl-table-pending-change', spy);

    // Typing back to the original value clears the pending edit entirely
    // (see setPendingValue), so the count drops from 1 to 0 - a real
    // transition, even though nothing was ever explicitly committed.
    controller.setPendingValue(alice, 'name', 'Alice');

    expect(spy).toHaveBeenCalledOnce();
    expect(
      (spy.mock.calls[0][0] as YatlTablePendingChangeEvent<Row>).changes,
    ).toEqual([]);
  });

  test('fires when committing a field clears the only pending edit', () => {
    const controller = createController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const spy = vi.fn();
    controller.addEventListener('yatl-table-pending-change', spy);

    controller.commitChanges(alice, 'name');

    expect(spy).toHaveBeenCalledOnce();
    expect(
      (spy.mock.calls[0][0] as YatlTablePendingChangeEvent<Row>).changes,
    ).toEqual([]);
  });

  test('fires when revertPendingChanges clears everything', async () => {
    const controller = createController();
    const [alice, bob] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    controller.setPendingValue(bob, 'age', 26);
    const spy = vi.fn();
    controller.addEventListener('yatl-table-pending-change', spy);

    await controller.revertPendingChanges();

    expect(spy).toHaveBeenCalledOnce();
    expect(
      (spy.mock.calls[0][0] as YatlTablePendingChangeEvent<Row>).changes,
    ).toEqual([]);
  });

  test('fires when createCommitTransaction moves an edit from pending to saving', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const spy = vi.fn();
    controller.addEventListener('yatl-table-pending-change', spy);

    controller.createCommitTransaction();

    // Pending count went from 1 (dirty) to 0 (saving, not pending).
    expect(spy).toHaveBeenCalledOnce();
    expect(
      (spy.mock.calls[0][0] as YatlTablePendingChangeEvent<Row>).changes,
    ).toEqual([]);
  });

  test('does not fire again on resolveTransaction, since resolving does not change the pending count', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;
    const spy = vi.fn();
    controller.addEventListener('yatl-table-pending-change', spy);

    controller.resolveTransaction(transaction.id);

    expect(spy).not.toHaveBeenCalled();
  });

  test('fires on rejectTransaction, since rejecting restores the edit to pending', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;
    const spy = vi.fn();
    controller.addEventListener('yatl-table-pending-change', spy);

    controller.rejectTransaction(transaction.id);

    expect(spy).toHaveBeenCalledOnce();
    expect(
      (spy.mock.calls[0][0] as YatlTablePendingChangeEvent<Row>).changes,
    ).toEqual([expect.objectContaining({ rowId: 1, changedFields: ['name'] })]);
  });

  test('does not fire on discardTransaction, since discarding does not change the pending count', () => {
    const controller = createEditableController();
    const [alice] = controller.data;
    controller.setPendingValue(alice, 'name', 'Alicia');
    const transaction = controller.createCommitTransaction()!;
    const spy = vi.fn();
    controller.addEventListener('yatl-table-pending-change', spy);

    controller.discardTransaction(transaction.id);

    expect(spy).not.toHaveBeenCalled();
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

  test('searchSortPriority defaults to saved on, unlike searchQuery', () => {
    const storage = createMemoryStorage();
    const controller = createController();
    controller.storageOptions = { key: 'test', storage };

    controller.searchSortPriority = 'sort';
    vi.advanceTimersByTime(1000);

    const saved = JSON.parse(storage.store.get('test')!);
    expect(saved.searchSortPriority).toBe('sort');
  });

  test('saveSearchSortPriority: false opts out of saving it', () => {
    const storage = createMemoryStorage();
    const controller = createController();
    controller.storageOptions = {
      key: 'test',
      storage,
      saveSearchSortPriority: false,
    };

    controller.searchSortPriority = 'sort';
    vi.advanceTimersByTime(1000);

    const saved = JSON.parse(storage.store.get('test')!);
    expect(saved.searchSortPriority).toBeUndefined();
  });

  test('a saved searchSortPriority is restored on a new controller instance', () => {
    const storage = createMemoryStorage();
    const first = createController();
    first.storageOptions = { key: 'test', storage };
    first.searchSortPriority = 'sort';
    vi.advanceTimersByTime(1000);

    const second = createController();
    second.storageOptions = { key: 'test', storage };

    expect(second.searchSortPriority).toBe('sort');
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

interface Employee {
  id: number;
  name: string;
  department: string | null;
  salary: number;
}

const getEmployeeData = (): Employee[] => [
  { id: 1, name: 'Alice', department: 'Eng', salary: 90 },
  { id: 2, name: 'Bob', department: null, salary: 70 },
  { id: 3, name: 'Charlie', department: 'Eng', salary: 80 },
  { id: 4, name: 'Dana', department: 'Sales', salary: 60 },
];

function createEmployeeController(
  columns: import('../types').ColumnOptions<Employee>[] = [
    { field: 'id' },
    { field: 'name' },
    { field: 'department' },
    { field: 'salary', sortable: true },
  ],
) {
  const controller = new YatlTableController<Employee>();
  controller.rowIdCallback = row => row.id;
  controller.columns = columns;
  controller.data = getEmployeeData();
  return controller;
}

describe('YatlTableController - sorting', () => {
  test('sorts ascending and descending', () => {
    const controller = createEmployeeController();

    controller.sort('salary', 'asc');
    expect(controller.filteredData.map(r => r.salary)).toEqual([
      60, 70, 80, 90,
    ]);

    controller.sort('salary', 'desc');
    expect(controller.filteredData.map(r => r.salary)).toEqual([
      90, 80, 70, 60,
    ]);
  });

  test('sorting by the same order twice is a no-op', () => {
    const controller = createEmployeeController();
    controller.sort('salary', 'asc');
    const before = controller.getColumnState('salary').sort;

    controller.sort('salary', 'asc');

    expect(controller.getColumnState('salary').sort).toEqual(before);
  });

  test('order: null removes sorting for that column', () => {
    const controller = createEmployeeController();
    controller.sort('salary', 'asc');

    controller.sort('salary', null);

    expect(controller.getColumnState('salary').sort).toBeNull();
    // Falls back to original insertion order.
    expect(controller.filteredData.map(r => r.id)).toEqual([1, 2, 3, 4]);
  });

  test('multi-column sort: the first-sorted column stays primary over a second (clear: false) sort', () => {
    const controller = createEmployeeController();

    // Sort by department first (primary), then by salary without clearing
    // (secondary tiebreaker).
    controller.sort('department', 'asc');
    controller.sort('salary', 'desc', false);

    // Within each department group, salary should be descending; groups
    // should stay ordered by department (nulls last, per column default).
    expect(controller.filteredData.map(r => [r.department, r.salary])).toEqual([
      ['Eng', 90],
      ['Eng', 80],
      ['Sales', 60],
      [null, 70],
    ]);
  });

  test('a plain sort() call (clear: true) clears any other active sort', () => {
    const controller = createEmployeeController();
    controller.sort('department', 'asc');
    controller.sort('salary', 'desc', false);

    controller.sort('salary', 'asc'); // clear: true (default)

    expect(controller.getColumnState('department').sort).toBeNull();
    expect(controller.filteredData.map(r => r.salary)).toEqual([
      60, 70, 80, 90,
    ]);
  });

  test('nulls sort last by default for ascending order', () => {
    const controller = createEmployeeController();
    controller.sort('department', 'asc');
    expect(controller.filteredData.at(-1)!.department).toBeNull();
  });

  test('nulls sort first by default for descending order', () => {
    const controller = createEmployeeController();
    controller.sort('department', 'desc');
    expect(controller.filteredData.at(0)!.department).toBeNull();
  });

  test('nullsLast forces nulls to the end even when sorting descending', () => {
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name' },
      { field: 'department', nullsLast: true },
      { field: 'salary' },
    ]);

    controller.sort('department', 'desc');

    expect(controller.filteredData.at(-1)!.department).toBeNull();
  });

  test('a custom sorter transforms the value used for comparison', () => {
    const controller = createEmployeeController([
      { field: 'id' },
      // Sort by the length of the name instead of alphabetically.
      { field: 'name', sorter: value => String(value).length },
      { field: 'department' },
      { field: 'salary' },
    ]);

    controller.sort('name', 'asc');

    // Bob(3), Dana(4), Alice(5), Charlie(7)
    expect(controller.filteredData.map(r => r.name)).toEqual([
      'Bob',
      'Dana',
      'Alice',
      'Charlie',
    ]);
  });
});

describe('YatlTableController - filtering', () => {
  test('filters by an exact value match', () => {
    const controller = createEmployeeController();
    controller.filters = { department: 'Eng' };
    expect(controller.filteredData.map(r => r.id)).toEqual([1, 3]);
  });

  test('an array filter value matches any of its elements (OR)', () => {
    const controller = createEmployeeController();
    controller.filters = { department: ['Sales', 'Eng'] };
    expect(controller.filteredData.map(r => r.id).sort()).toEqual([1, 3, 4]);
  });

  test('an empty array filter value matches everything', () => {
    const controller = createEmployeeController();
    controller.filters = { department: [] };
    expect(controller.filteredData).toHaveLength(4);
  });

  test('an array row value matches if any element matches the filter', () => {
    interface Tagged {
      id: number;
      tags: string[];
    }
    const controller = new YatlTableController<Tagged>();
    controller.rowIdCallback = row => row.id;
    controller.columns = [{ field: 'id' }, { field: 'tags' }];
    controller.data = [
      { id: 1, tags: ['red', 'blue'] },
      { id: 2, tags: ['green'] },
    ];

    controller.filters = { tags: 'red' };
    expect(controller.filteredData.map(r => r.id)).toEqual([1]);
  });

  test('a RegExp filter tests the stringified value', () => {
    const controller = createEmployeeController();
    controller.filters = { name: /^[AB]/ };
    expect(controller.filteredData.map(r => r.id)).toEqual([1, 2]);
  });

  test('a Date filter matches by exact time', () => {
    interface Event {
      id: number;
      when: Date;
    }
    const controller = new YatlTableController<Event>();
    controller.rowIdCallback = row => row.id;
    controller.columns = [{ field: 'id' }, { field: 'when' }];
    const target = new Date('2024-01-01T00:00:00Z');
    controller.data = [
      { id: 1, when: target },
      { id: 2, when: new Date('2024-06-01T00:00:00Z') },
    ];

    controller.filters = { when: new Date('2024-01-01T00:00:00Z') };
    expect(controller.filteredData.map(r => r.id)).toEqual([1]);
  });

  test('a function filter value is used as a direct predicate', () => {
    const controller = createEmployeeController();
    controller.filters = {
      salary: (value: unknown) => (value as number) >= 80,
    };
    expect(controller.filteredData.map(r => r.id).sort()).toEqual([1, 3]);
  });

  test('a per-column custom filter callback is used instead of the default comparison', () => {
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name' },
      { field: 'department' },
      {
        field: 'salary',
        filter: (value, filter) => (value as number) >= (filter as number),
      },
    ]);

    controller.filters = { salary: 75 };
    expect(controller.filteredData.map(r => r.id).sort()).toEqual([1, 3]);
  });

  test('filterStrategy completely overrides the default field-by-field filtering', () => {
    const controller = createEmployeeController();
    controller.filterStrategy = (row: Employee) => row.salary > 65;

    // The regular filters object should be ignored entirely.
    controller.filters = { department: 'Sales' };

    expect(controller.filteredData.map(r => r.id).sort()).toEqual([1, 2, 3]);
  });

  test('a null filters object matches every row', () => {
    const controller = createEmployeeController();
    controller.filters = { department: 'Eng' };
    expect(controller.filteredData).toHaveLength(2);

    controller.filters = null;
    expect(controller.filteredData).toHaveLength(4);
  });

  test('getColumnFilterValues returns unique values with counts', () => {
    const controller = createEmployeeController();
    const options = controller.getColumnFilterValues('department');

    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'Eng', count: 2 }),
        expect.objectContaining({ value: 'Sales', count: 1 }),
      ]),
    );
    // Nulls excluded by default.
    expect(options.some(o => o.value === null)).toBe(false);
  });

  test('getColumnFilterValues includes null when includeNull is true', () => {
    const controller = createEmployeeController();
    const options = controller.getColumnFilterValues('department', true);

    expect(options.some(o => o.value === null)).toBe(true);
  });

  test('getColumnFilterValues uses valueFormatter for non-array fields', () => {
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name' },
      {
        field: 'department',
        valueFormatter: value => `Dept: ${value ?? 'none'}`,
      },
      { field: 'salary' },
    ]);

    const options = controller.getColumnFilterValues('department');
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'Eng', label: 'Dept: Eng' }),
        expect.objectContaining({ value: 'Sales', label: 'Dept: Sales' }),
      ]),
    );
  });

  test('getColumnFilterValues flattens array fields into one option per element', () => {
    interface Post {
      id: number;
      tags: string[];
    }
    const controller = new YatlTableController<Post>();
    controller.rowIdCallback = row => row.id;
    controller.columns = [{ field: 'id' }, { field: 'tags' }];
    controller.data = [
      { id: 1, tags: ['a', 'b'] },
      { id: 2, tags: ['b', 'c'] },
    ];

    const options = controller.getColumnFilterValues('tags');
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'a', count: 1 }),
        expect.objectContaining({ value: 'b', count: 2 }),
        expect.objectContaining({ value: 'c', count: 1 }),
      ]),
    );
  });

  test('getColumnFilterValues does not pass flattened array elements to valueFormatter', () => {
    interface Post {
      id: number;
      tags: string[];
    }
    const valueFormatter = vi.fn((value: unknown) => `fmt:${value}`);
    const controller = new YatlTableController<Post>();
    controller.rowIdCallback = row => row.id;
    controller.columns = [{ field: 'id' }, { field: 'tags', valueFormatter }];
    controller.data = [{ id: 1, tags: ['a', 'b'] }];

    const options = controller.getColumnFilterValues('tags');
    // valueFormatter is written to format the whole cell value (the full
    // array), not a single flattened element - it must not be called here.
    expect(valueFormatter).not.toHaveBeenCalled();
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'a', label: 'a' }),
        expect.objectContaining({ value: 'b', label: 'b' }),
      ]),
    );
  });

  test('getColumnFilterValues uses filterOptionFormatter for flattened array elements', () => {
    interface Post {
      id: number;
      tags: string[];
    }
    const valueFormatter = vi.fn((value: unknown) => `fmt:${value}`);
    const controller = new YatlTableController<Post>();
    controller.rowIdCallback = row => row.id;
    controller.columns = [
      {
        field: 'id',
      },
      {
        field: 'tags',
        valueFormatter,
        filterOptionFormatter: value => `#${value}`,
      },
    ];
    controller.data = [{ id: 1, tags: ['a', 'b'] }];

    const options = controller.getColumnFilterValues('tags');
    expect(valueFormatter).not.toHaveBeenCalled();
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'a', label: '#a' }),
        expect.objectContaining({ value: 'b', label: '#b' }),
      ]),
    );
  });

  test('getColumnFilterValues uses filterOptionFormatter for non-array fields too', () => {
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name' },
      {
        field: 'department',
        filterOptionFormatter: value => `~${value}~`,
      },
      { field: 'salary' },
    ]);

    const options = controller.getColumnFilterValues('department');
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'Eng', label: '~Eng~' }),
      ]),
    );
  });
});

describe('YatlTableController - row id generation', () => {
  test('generates a composite id from primary columns, joined with "::"', () => {
    interface Composite {
      orgId: number;
      userId: number;
      name: string;
    }
    const controller = new YatlTableController<Composite>();
    controller.columns = [
      { field: 'orgId', primary: true },
      { field: 'userId', primary: true },
      { field: 'name' },
    ];
    controller.data = [{ orgId: 1, userId: 5, name: 'Alice' }];

    expect(controller.getRowId(controller.data[0])).toBe('1::5');
  });

  test('falls back to a common id field when there is no callback or primary column', () => {
    interface Basic {
      id: number;
      name: string;
    }
    const controller = new YatlTableController<Basic>();
    controller.columns = [{ field: 'id' }, { field: 'name' }];
    controller.data = [{ id: 42, name: 'Alice' }];

    expect(controller.getRowId(controller.data[0])).toBe(42);
  });

  test('a column explicitly marked primary: false is skipped in the common-key fallback', () => {
    interface Basic {
      id: number;
      name: string;
    }
    const controller = new YatlTableController<Basic>();
    controller.columns = [{ field: 'id', primary: false }, { field: 'name' }];
    controller.data = [{ id: 1, name: 'Alice' }];

    // 'id' is opted out, so it should fall back to an index-based id
    // instead of using the field value directly.
    expect(controller.getRowId(controller.data[0])).not.toBe(1);
  });

  test('falls back to an index-based id when nothing else is available', () => {
    interface NoId {
      name: string;
    }
    const controller = new YatlTableController<NoId>();
    controller.columns = [{ field: 'name' }];
    controller.data = [{ name: 'Alice' }, { name: 'Bob' }];

    const [alice, bob] = controller.data;
    expect(controller.getRowId(alice)).not.toBe(controller.getRowId(bob));
    expect(controller.getRow(controller.getRowId(alice))).toBe(alice);
    expect(controller.getRow(controller.getRowId(bob))).toBe(bob);
  });

  test('a duplicate generated id falls back to an index-based id for the later row', () => {
    interface Basic {
      id: number;
      name: string;
    }
    const controller = new YatlTableController<Basic>();
    controller.columns = [{ field: 'id' }, { field: 'name' }];
    controller.data = [
      { id: 1, name: 'Alice' },
      { id: 1, name: 'Also Alice' },
    ];

    const [first, second] = controller.data;
    const firstId = controller.getRowId(first);
    const secondId = controller.getRowId(second);

    expect(firstId).not.toBe(secondId);
    expect(controller.getRow(firstId)!.name).toBe('Alice');
    expect(controller.getRow(secondId)!.name).toBe('Also Alice');
  });

  test('getRowId throws for a row object that is not part of the current dataset', () => {
    const controller = createEmployeeController();
    const foreignRow = { id: 99, name: 'Ghost', department: null, salary: 0 };

    expect(() => controller.getRowId(foreignRow)).toThrow();
  });
});

describe('YatlTableController - finding rows', () => {
  test('findRow finds the first row matching a field value', () => {
    const controller = createEmployeeController();
    expect(controller.findRow('department', 'Eng')?.name).toBe('Alice');
  });

  test('findRowIndex returns the original index of the matching row', () => {
    const controller = createEmployeeController();
    expect(controller.findRowIndex('name', 'Charlie')).toBe(2);
  });

  test('findRow and findRowIndex report no match', () => {
    const controller = createEmployeeController();
    expect(controller.findRow('name', 'Zach')).toBeUndefined();
    expect(controller.findRowIndex('name', 'Zach')).toBe(-1);
  });
});

describe('YatlTableController - row deletion', () => {
  test('deleteRow removes the row and cleans up selection', () => {
    const controller = createEmployeeController();
    controller.rowSelectionMethod = 'multi';
    controller.selectRow(controller.data[0]);

    controller.deleteRow(1);

    expect(controller.data.map(r => r.id)).toEqual([2, 3, 4]);
    expect(controller.selectedRowIds).toEqual([]);
  });

  test('deleteRow silently ignores an id that does not exist', () => {
    const controller = createEmployeeController();
    expect(() => controller.deleteRow(999)).not.toThrow();
    expect(controller.data).toHaveLength(4);
  });

  test('deleteRowAtIndex produces the same result regardless of the order indices are given in', () => {
    const ascending = createEmployeeController();
    ascending.deleteRowAtIndex(0, 2); // intends to remove Alice(0) and Charlie(2)

    const descending = createEmployeeController();
    descending.deleteRowAtIndex(2, 0);

    expect(ascending.data.map(r => r.id)).toEqual([2, 4]);
    expect(descending.data.map(r => r.id)).toEqual([2, 4]);
  });
});

describe('YatlTableController - row updates', () => {
  test('updateRow applies a partial update by row id', () => {
    const controller = createEmployeeController();
    controller.updateRow(1, { salary: 999 });
    expect(controller.getRow(1)!.salary).toBe(999);
  });

  test('updateRowAtIndex applies a partial update by original index', () => {
    const controller = createEmployeeController();
    controller.updateRowAtIndex(0, { salary: 999 });
    expect(controller.data[0].salary).toBe(999);
  });

  test('updateRow silently no-ops for an id that does not exist', () => {
    const controller = createEmployeeController();
    expect(() => controller.updateRow(999, { salary: 1 })).not.toThrow();
  });
});

describe('YatlTableController - moveColumn', () => {
  test('moves a column to a numeric index', () => {
    const controller = createEmployeeController();
    controller.moveColumn('id', 3);
    expect(controller.displayColumns.map(c => c.field)).toEqual([
      'name',
      'department',
      'salary',
      'id',
    ]);
  });

  test('moves a column relative to another field', () => {
    const controller = createEmployeeController();
    controller.moveColumn('salary', 'id');
    expect(controller.displayColumns.map(c => c.field)).toEqual([
      'salary',
      'id',
      'name',
      'department',
    ]);
  });

  test('does nothing when moving a column to its own position', () => {
    const controller = createEmployeeController();
    const spy = vi.fn();
    controller.addEventListener('yatl-column-reorder', spy);

    controller.moveColumn('name', 1);

    expect(spy).not.toHaveBeenCalled();
    expect(controller.displayColumns.map(c => c.field)).toEqual([
      'id',
      'name',
      'department',
      'salary',
    ]);
  });

  test('does nothing for a field that does not exist', () => {
    const controller = createEmployeeController();
    const before = controller.displayColumns.map(c => c.field);

    // @ts-expect-error - deliberately invalid field for the runtime check
    controller.moveColumn('doesNotExist', 0);

    expect(controller.displayColumns.map(c => c.field)).toEqual(before);
  });
});

describe('YatlTableController - sticky columns', () => {
  test('stickColumn/unstickColumn toggle stickyPosition', () => {
    const controller = createEmployeeController();
    controller.stickColumn('name');
    expect(controller.getColumnState('name').stickyPosition).toBe('left');

    controller.unstickColumn('name');
    expect(controller.getColumnState('name').stickyPosition).toBe(false);
  });

  test('toggleColumnSticky flips between left and unstuck when no position is given', () => {
    const controller = createEmployeeController();
    controller.toggleColumnSticky('name');
    expect(controller.getColumnState('name').stickyPosition).toBe('left');

    controller.toggleColumnSticky('name');
    expect(controller.getColumnState('name').stickyPosition).toBe(false);
  });

  test('setting the same sticky position twice fires no event the second time', () => {
    const controller = createEmployeeController();
    controller.stickColumn('name');

    const spy = vi.fn();
    controller.addEventListener('yatl-column-stick', spy);
    controller.stickColumn('name');

    expect(spy).not.toHaveBeenCalled();
  });
});

describe('YatlTableController - CSV export', () => {
  async function exportText(
    controller: YatlTableController<Employee>,
    options?: Parameters<YatlTableController<Employee>['export']>[0],
  ) {
    return controller.export(options).text();
  }

  test('exports visible columns and rows as CSV', async () => {
    const controller = createEmployeeController();
    const csv = await exportText(controller);

    const lines = csv.split('\n');
    expect(lines[0]).toBe('"id","name","department","salary"');
    expect(lines).toHaveLength(5); // header + 4 rows
    expect(lines[1]).toBe('"1","Alice","Eng","90"');
  });

  test('escapes every quote character in a value, not just the first', async () => {
    const controller = createEmployeeController();
    controller.updateRow(1, { name: 'He said "hi" and "bye"' });

    const csv = await exportText(controller);

    expect(csv).toContain('"He said ""hi"" and ""bye"""');
  });

  test('escapes quote characters in a column header', async () => {
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name', title: 'The "Name" Field' },
      { field: 'department' },
      { field: 'salary' },
    ]);

    const csv = await exportText(controller);

    expect(csv.split('\n')[0]).toContain('"The ""Name"" Field"');
  });

  test('excludes hidden columns by default, includes them with includeHiddenColumns', async () => {
    const controller = createEmployeeController();
    controller.hideColumn('department');

    const defaultCsv = await exportText(controller);
    expect(defaultCsv.split('\n')[0]).not.toContain('department');

    const fullCsv = await exportText(controller, {
      includeHiddenColumns: true,
    });
    expect(fullCsv.split('\n')[0]).toContain('department');
  });

  test('exports only filtered rows by default, all rows with includeAllRows', async () => {
    const controller = createEmployeeController();
    controller.filters = { department: 'Eng' };

    const filteredCsv = await exportText(controller);
    expect(filteredCsv.split('\n')).toHaveLength(3); // header + 2 Eng rows

    const allCsv = await exportText(controller, { includeAllRows: true });
    expect(allCsv.split('\n')).toHaveLength(5); // header + all 4 rows
  });

  test('applies a column valueFormatter to exported values', async () => {
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name' },
      { field: 'department' },
      {
        field: 'salary',
        valueFormatter: value => `$${value}`,
      },
    ]);

    const csv = await exportText(controller);
    expect(csv.split('\n')[1]).toContain('"$90"');
  });
});

describe('YatlTableController - row selection', () => {
  test('selecting a row has no visible effect until a rowSelectionMethod is set', () => {
    const controller = createEmployeeController();
    controller.selectRow(controller.data[0]);

    expect(controller.selectedRowIds).toEqual([]);
    expect(controller.isRowSelected(controller.data[0])).toBe(false);
  });

  test('single selection mode replaces the previous selection', () => {
    const controller = createEmployeeController();
    controller.rowSelectionMethod = 'single';

    controller.selectRow(controller.data[0]);
    controller.selectRow(controller.data[1]);

    expect(controller.selectedRowIds).toEqual([2]);
  });

  test('multi selection mode accumulates selections', () => {
    const controller = createEmployeeController();
    controller.rowSelectionMethod = 'multi';

    controller.selectRow(controller.data[0]);
    controller.selectRow(controller.data[1]);

    expect(controller.selectedRowIds.sort()).toEqual([1, 2]);
  });

  test('deselectRow removes just that row from a multi selection', () => {
    const controller = createEmployeeController();
    controller.rowSelectionMethod = 'multi';
    controller.selectRow(controller.data[0]);
    controller.selectRow(controller.data[1]);

    controller.deselectRow(controller.data[0]);

    expect(controller.selectedRowIds).toEqual([2]);
  });

  test('selectAll is a no-op in single selection mode', () => {
    const controller = createEmployeeController();
    controller.rowSelectionMethod = 'single';

    controller.selectAll();

    expect(controller.selectedRowIds).toEqual([]);
  });

  test('selectAll only selects the currently filtered rows, not hidden ones', () => {
    const controller = createEmployeeController();
    controller.rowSelectionMethod = 'multi';
    controller.filters = { department: 'Eng' };

    controller.selectAll();

    expect(controller.selectedRowIds.sort()).toEqual([1, 3]);
  });

  test('deselectAll clears the selection', () => {
    const controller = createEmployeeController();
    controller.rowSelectionMethod = 'multi';
    controller.selectAll();

    controller.deselectAll();

    expect(controller.selectedRowIds).toEqual([]);
  });
});

describe('YatlTableController - lazy sort value computation', () => {
  test('a column sorter is never invoked for a column that is never sorted by', () => {
    const nameSorter = vi.fn((value: unknown) => value as string | number);
    const salarySorter = vi.fn((value: unknown) => value as string | number);
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name', sorter: nameSorter },
      { field: 'department' },
      { field: 'salary', sorter: salarySorter },
    ]);

    controller.sort('salary', 'asc');
    // Sorting itself shouldn't compute anything - only reading the data does.
    expect(salarySorter).not.toHaveBeenCalled();

    void controller.filteredData;

    expect(salarySorter).toHaveBeenCalledTimes(4); // once per row
    expect(nameSorter).not.toHaveBeenCalled();
  });

  test('a column sorter is not re-invoked on repeated, unchanged access', () => {
    const salarySorter = vi.fn((value: unknown) => value as string | number);
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name' },
      { field: 'department' },
      { field: 'salary', sorter: salarySorter },
    ]);

    controller.sort('salary', 'asc');
    void controller.filteredData;
    void controller.filteredData;
    void controller.filteredData;

    expect(salarySorter).toHaveBeenCalledTimes(4);
  });

  test('switching back to a previously-sorted column does not recompute it again', () => {
    const nameSorter = vi.fn((value: unknown) => value as string | number);
    const salarySorter = vi.fn((value: unknown) => value as string | number);
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name', sorter: nameSorter },
      { field: 'department' },
      { field: 'salary', sorter: salarySorter },
    ]);

    controller.sort('name', 'asc');
    void controller.filteredData;
    expect(nameSorter).toHaveBeenCalledTimes(4);

    controller.sort('salary', 'asc'); // switches the active sort column
    void controller.filteredData;
    expect(salarySorter).toHaveBeenCalledTimes(4);

    controller.sort('name', 'asc'); // back to name - no rebuild happened
    void controller.filteredData;
    expect(nameSorter).toHaveBeenCalledTimes(4); // still 4, not recomputed
  });

  test('a data reload invalidates the cache, forcing recomputation for the still-active sort column', () => {
    const nameSorter = vi.fn((value: unknown) => value as string | number);
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name', sorter: nameSorter },
      { field: 'department' },
      { field: 'salary' },
    ]);

    controller.sort('name', 'asc');
    void controller.filteredData;
    expect(nameSorter).toHaveBeenCalledTimes(4);

    controller.data = getEmployeeData(); // fresh row objects, same ids
    void controller.filteredData;

    expect(nameSorter).toHaveBeenCalledTimes(8);
  });

  test('reloading data while sorted updates the order to reflect new values, with no manual re-sort call', () => {
    const controller = createEmployeeController();
    controller.sort('salary', 'asc');
    // Dana(60), Bob(70), Charlie(80), Alice(90)
    expect(controller.filteredData.map(r => r.id)).toEqual([4, 2, 3, 1]);

    // Reload: Dana's salary jumps to the highest. No sort() call here -
    // the table should already be sorted correctly once we read it.
    controller.data = [
      { id: 1, name: 'Alice', department: 'Eng', salary: 90 },
      { id: 2, name: 'Bob', department: null, salary: 70 },
      { id: 3, name: 'Charlie', department: 'Eng', salary: 80 },
      { id: 4, name: 'Dana', department: 'Sales', salary: 999 },
    ];

    expect(controller.filteredData.map(r => r.id)).toEqual([2, 3, 1, 4]);
  });

  test('committing an edit to the actively-sorted field updates the order without an explicit re-sort', () => {
    const controller = createEmployeeController();
    controller.sort('salary', 'asc');
    expect(controller.filteredData.map(r => r.id)).toEqual([4, 2, 3, 1]);

    const alice = controller.data.find(r => r.id === 1)!;
    controller.setPendingValue(alice, 'salary', 1);
    controller.commitChanges(alice, 'salary');

    expect(controller.filteredData.map(r => r.id)).toEqual([1, 4, 2, 3]);
  });
});

interface Product {
  id: number;
  category: string;
  name: string;
}

function createSearchPriorityController(
  searchSortPriority: 'score' | 'sort' = 'score',
) {
  const controller = new YatlTableController<Product>();
  controller.rowIdCallback = row => row.id;
  controller.columns = [
    { field: 'id' },
    { field: 'category' },
    { field: 'name', searchable: true },
  ];
  controller.scoredSearch = true;
  controller.searchSortPriority = searchSortPriority;
  controller.data = [
    { id: 1, category: 'B', name: 'app' }, // exact match
    { id: 2, category: 'A', name: 'apple' }, // prefix match
    { id: 3, category: 'A', name: 'pineapple' }, // substring match
  ];
  return controller;
}

describe('YatlTableController - searchSortPriority', () => {
  test("defaults to 'score': relevance ordering ignores the active column sort", () => {
    const controller = createSearchPriorityController(); // default 'score'
    controller.sort('category', 'asc');
    controller.searchQuery = 'app';

    // Pure relevance order: exact(1) > prefix(2) > substring(3), regardless
    // of the category sort (which would otherwise put the A's first).
    expect(controller.filteredData.map(r => r.id)).toEqual([1, 2, 3]);
  });

  test("'sort': the active column sort takes precedence over relevance", () => {
    const controller = createSearchPriorityController('sort');
    controller.sort('category', 'asc');
    controller.searchQuery = 'app';

    // Category groups first (A, A, B) - within category A, relevance
    // still breaks the tie (prefix match id 2 before substring match id 3).
    expect(controller.filteredData.map(r => r.id)).toEqual([2, 3, 1]);
  });

  test("'sort' falls back to relevance ordering when no column sort is active", () => {
    const controller = createSearchPriorityController('sort');
    controller.searchQuery = 'app'; // no sort() call

    expect(controller.filteredData.map(r => r.id)).toEqual([1, 2, 3]);
  });

  test('changing searchSortPriority re-orders existing results without a new query', () => {
    const controller = createSearchPriorityController('score');
    controller.sort('category', 'asc');
    controller.searchQuery = 'app';
    expect(controller.filteredData.map(r => r.id)).toEqual([1, 2, 3]);

    controller.searchSortPriority = 'sort';

    expect(controller.filteredData.map(r => r.id)).toEqual([2, 3, 1]);
  });

  test('has no effect when scoredSearch is off - the column sort already decides alone', () => {
    const controller = createSearchPriorityController('sort');
    controller.scoredSearch = false;
    controller.sort('category', 'asc');
    controller.searchQuery = 'app';

    expect(controller.filteredData.map(r => r.id)).toEqual([2, 3, 1]);
  });
});

describe('YatlTableController - targeted single-row updates', () => {
  test('updateRow refreshes the order when the edited field is actively sorted', () => {
    const controller = createEmployeeController();
    controller.sort('salary', 'asc');
    expect(controller.filteredData.map(r => r.id)).toEqual([4, 2, 3, 1]);

    controller.updateRow(1, { salary: 1 }); // Alice's salary drops to lowest

    expect(controller.filteredData.map(r => r.id)).toEqual([1, 4, 2, 3]);
  });

  test('updateRowAtIndex works the same way as updateRow', () => {
    const controller = createEmployeeController();
    controller.sort('salary', 'asc');

    controller.updateRowAtIndex(0, { salary: 1 }); // Alice is at index 0

    expect(controller.filteredData.map(r => r.id)).toEqual([1, 4, 2, 3]);
  });

  test('editing one row does not invalidate a different row cached sort value', () => {
    const nameSorter = vi.fn((value: unknown) => value as string);
    const controller = createEmployeeController([
      { field: 'id' },
      { field: 'name', sorter: nameSorter },
      { field: 'department' },
      { field: 'salary' },
    ]);
    controller.sort('name', 'asc');
    void controller.filteredData;
    nameSorter.mockClear(); // ignore the initial per-row computation

    controller.updateRow(2, { salary: 999 }); // Bob's salary, not name
    void controller.filteredData;

    // Editing a row invalidates that row's whole sort-value cache (not
    // just the edited field), so Bob's own cached name value needs one
    // recompute - but a full rebuild would have wiped and recomputed
    // every *other* row's cached name value too. It shouldn't have.
    expect(nameSorter).toHaveBeenCalledTimes(1);
  });

  test("updateRow falls back to a full rebuild when the edit changes the row's own identity", () => {
    interface Sku {
      id: number;
      sku: string;
      name: string;
    }
    const controller = new YatlTableController<Sku>();
    controller.columns = [
      { field: 'id' },
      { field: 'sku', primary: true },
      { field: 'name' },
    ];
    controller.data = [
      { id: 1, sku: 'A100', name: 'Widget' },
      { id: 2, sku: 'B200', name: 'Gadget' },
    ];

    const widget = controller.data[0];
    const oldId = controller.getRowId(widget);
    expect(oldId).toBe('A100');

    controller.updateRow(oldId, { sku: 'A999' });

    // The row is now findable under its new id, not the old one - only
    // possible if the id-to-row maps were actually rebuilt.
    expect(controller.getRow('A999')).toBe(widget);
    expect(controller.getRow('A100')).toBeUndefined();
    expect(controller.getRowId(widget)).toBe('A999');
  });
});
