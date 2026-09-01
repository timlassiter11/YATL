import { describe, expect, test } from 'vitest';
import { YatlTableController } from './table-controller';

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
