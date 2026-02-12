import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { YatlColumnSortRequest, YatlRowClickEvent } from '../../events';
import { ColumnOptions } from '../../types';
import { YatlTable } from './yatl-table';

import './yatl-table';

// --- Test Data ---
interface User {
  id: number;
  name: string;
  role: string;
  age: number;
}

// Use functions so data isn't shared between tests
const getColumns = (): ColumnOptions<User>[] => [
  { field: 'id', title: 'ID' },
  { field: 'name', title: 'Name', sortable: true, searchable: true },
  { field: 'role', title: 'Role', sortable: true, searchable: true },
  { field: 'age', title: 'Age', sortable: true },
];

const getData = (): User[] => [
  { id: 1, name: 'Alice', role: 'Admin', age: 30 },
  { id: 2, name: 'Bob', role: 'User', age: 25 },
  { id: 3, name: 'Charlie', role: 'User', age: 35 },
  { id: 4, name: 'David', role: 'Manager', age: 40 },
];

async function renderTable(props: Partial<YatlTable<User>> = {}) {
  document.body.innerHTML = '<yatl-table></yatl-table>';
  const el = document.querySelector<YatlTable<User>>('yatl-table')!;

  el.columns = props.columns ?? getColumns();
  el.data = props.data ?? getData();
  el.rowIdCallback = row => row.id;

  Object.assign(el, props);

  await el.updateComplete;
  return el;
}

describe('YatlTable Component', () => {
  describe('Rendering', () => {
    test('renders the correct number of rows (Header + Body)', async () => {
      const el = await renderTable();
      const table = page.elementLocator(el);

      const rows = table.getByRole('row');

      await expect.element(rows).toHaveLength(5);
    });

    test('renders column headers with correct names', async () => {
      const el = await renderTable();
      const table = page.elementLocator(el);

      const nameHeader = table.getByRole('columnheader', { name: 'Name' });
      await expect.element(nameHeader).toBeVisible();
    });

    test('renders cells with correct data', async () => {
      const el = await renderTable();
      const table = page.elementLocator(el);

      const aliceRow = table.getByRole('row').filter({ hasText: 'Alice' });

      const nameCell = aliceRow.getByRole('cell', { name: 'Alice' });
      await expect.element(nameCell).toBeVisible();
    });
  });

  describe('Sorting', () => {
    test('updates aria-sort attribute when clicked', async () => {
      const el = await renderTable();
      const table = page.elementLocator(el);

      const header = table.getByRole('columnheader', { name: 'Age' });

      await expect.element(header).toHaveAttribute('aria-sort', 'none');

      await userEvent.click(header);
      await expect.element(header).toHaveAttribute('aria-sort', 'ascending');

      const firstDataRow = table.getByRole('row').nth(1);
      await expect.element(firstDataRow).toHaveTextContent(/Bob/);

      await userEvent.click(header);
      await expect.element(header).toHaveAttribute('aria-sort', 'descending');
    });
  });

  describe('Row Selection', () => {
    test('toggles aria-selected on row when clicked', async () => {
      const el = await renderTable({ rowSelectionMethod: 'multi' });
      const table = page.elementLocator(el);

      const row = table.getByRole('row').filter({ hasText: 'Alice' });
      const checkbox = row.getByRole('checkbox');

      await userEvent.click(checkbox);
      await el.updateComplete;

      await expect.element(row).toHaveAttribute('aria-selected', 'true');
      await expect.element(checkbox).toBeChecked();
    });

    test('selectAll updates all rows', async () => {
      const el = await renderTable({ rowSelectionMethod: 'multi' });
      const table = page.elementLocator(el);

      el.selectAll();
      await el.updateComplete;

      const selectedRows = table.getByRole('row', { selected: true });
      await expect.element(selectedRows).toHaveLength(4);
    });
  });

  describe('Search & Filter', () => {
    test('filters rows visible in the accessibility tree', async () => {
      const el = await renderTable();
      const table = page.elementLocator(el);

      el.searchQuery = 'Manager';
      await el.updateComplete;

      // Should have 2 rows total: 1 Header + 1 Data Row (David)
      const rows = table.getByRole('row');
      await expect.element(rows).toHaveLength(2);

      const dataRow = table.getByRole('row').nth(1);
      await expect.element(dataRow).toHaveTextContent(/David/);
    });
  });

  describe('Events & Interceptors', () => {
    test('fires yatl-row-click with row details', async () => {
      const el = await renderTable();
      const table = page.elementLocator(el);
      const spy = vi.fn();
      el.addEventListener(YatlRowClickEvent.EVENT_NAME, spy);

      // Click Alice's Name Cell
      const cell = table.getByRole('cell', { name: 'Alice' });
      await userEvent.click(cell);

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0].row.name).toBe('Alice');
    });

    test('respects prevented sort request', async () => {
      const el = await renderTable();
      const table = page.elementLocator(el);

      // Block sorting
      el.addEventListener(YatlColumnSortRequest.EVENT_NAME, e => {
        e.preventDefault();
      });

      const header = table.getByRole('columnheader', { name: 'Age' });
      await userEvent.click(header);
      await el.updateComplete;

      // Verify ARIA sort did NOT change
      await expect.element(header).toHaveAttribute('aria-sort', 'none');
    });
  });

  describe('Column Visibility', () => {
    test('removes columnheader from accessibility tree when hidden', async () => {
      const el = await renderTable();
      const table = page.elementLocator(el);

      el.hideColumn('role');
      await el.updateComplete;

      // The 'Role' header should no longer exist in the table
      const header = table.getByRole('columnheader', { name: 'Role' });
      await expect.element(header).not.toBeInTheDocument();
    });
  });

  describe('Complex Filtering Logic', () => {
    // We define a table of inputs and expected outputs
    test.each([
      { query: 'Admin', expectedRows: 1, desc: 'Exact Match' },
      { query: 'admin', expectedRows: 1, desc: 'Case Insensitive' },
      { query: 'User', expectedRows: 2, desc: 'Multiple Matches' },
      { query: 'Z', expectedRows: 0, desc: 'No Match' },
      { query: '', expectedRows: 4, desc: 'Empty Query (Show All)' },
    ])('Search: $desc ("$query")', async ({ query, expectedRows }) => {
      const el = await renderTable();
      el.searchQuery = query;
      await el.updateComplete;

      const rows = page.elementLocator(el).getByRole('row');
      // +1 for the header row
      await expect.element(rows).toHaveLength(expectedRows + 1);
    });
  });

  describe('Dirty Data Handling', () => {
    const DIRTY_DATA = [
      { id: 1, name: null, role: 'Admin', age: 30 }, // Null value
      { id: 2, name: 'Bob', role: undefined, age: 25 }, // Undefined value
      { id: 3, role: 'User', age: 35 }, // Missing key 'name'
    ];

    test('renders placeholder for null/undefined values', async () => {
      const el = await renderTable({
        data: DIRTY_DATA as any, // Cast to ignore TS errors for this test
        nullValuePlaceholder: '--',
      });
      const table = page.elementLocator(el);

      // Null should become placeholder
      const nullCell = table.getByRole('row').nth(1).getByRole('cell').nth(1); // Name column
      await expect.element(nullCell).toHaveTextContent('--');

      // Undefined should become placeholder
      const undefinedCell = table
        .getByRole('row')
        .nth(2)
        .getByRole('cell')
        .nth(2); // Role column
      await expect.element(undefinedCell).toHaveTextContent('--');
    });

    test('does not crash when sorting dirty data', async () => {
      const el = await renderTable({
        data: DIRTY_DATA as any,
        nullValuePlaceholder: '--',
      });
      const table = page.elementLocator(el);

      // Sort by the dirty column
      el.sort('name', 'asc');
      await el.updateComplete;

      const rows = table.getByRole('row');
      await expect
        .element(rows.nth(1).getByRole('cell').nth(1))
        .toHaveTextContent(/Bob/);
      await expect
        .element(rows.nth(2).getByRole('cell').nth(1))
        .toHaveTextContent(/--/);
      await expect
        .element(rows.nth(3).getByRole('cell').nth(1))
        .toHaveTextContent(/--/);
    });
  });

  describe('State Persistence', () => {
    test('saves state to localStorage when columns are toggled', async () => {
      // 1. Mock LocalStorage
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      const el = await renderTable({
        storageOptions: {
          key: 'test-table-v1',
          storage: 'local',
          saveColumnVisibility: true,
        },
      });

      // 2. Trigger a change (Hide a column)
      el.hideColumn('role');
      await el.updateComplete;

      // Wait for debounce (1000ms in your code)
      await vi.waitUntil(() => setItemSpy.mock.calls.length > 0, {
        timeout: 1500,
      });

      // 3. Verify
      expect(setItemSpy).toHaveBeenCalled();
      const [key, value] = setItemSpy.mock.calls[0];
      expect(key).toBe('test-table-v1');
      expect(JSON.parse(value as string).columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'role', visible: false }),
        ]),
      );
    });

    test('restores state from localStorage on init', async () => {
      // 1. Seed LocalStorage BEFORE rendering
      const savedState = {
        searchQuery: 'Restored Query',
        columns: [{ field: 'age', visible: false }],
      };
      localStorage.setItem('test-table-restored', JSON.stringify(savedState));

      // 2. Render
      const el = await renderTable({
        storageOptions: {
          key: 'test-table-restored',
          storage: 'local',
          saveSearchQuery: true,
        },
      });

      // 3. Verify the table picked it up
      expect(el.searchQuery).toBe('Restored Query');

      const table = page.elementLocator(el);
      const ageHeader = table.getByRole('columnheader', { name: 'Age' });
      await expect.element(ageHeader).not.toBeInTheDocument();
    });
  });

  describe('CRUD API', () => {
    test('updateRowAtIndex updates the DOM', async () => {
      const el = await renderTable();
      const table = page.elementLocator(el);

      // Change Alice to "Super Alice"
      el.updateRowAtIndex(0, { name: 'Super Alice' });
      await el.updateComplete;

      const cell = table.getByRole('cell', { name: 'Super Alice' });
      await expect.element(cell).toBeVisible();
    });

    test('deleteRow removes the row from DOM', async () => {
      const el = await renderTable();
      const table = page.elementLocator(el);

      // Delete Alice (ID 1)
      el.deleteRow(1);
      await el.updateComplete;

      const rows = table.getByRole('row');
      await expect.element(rows).toHaveLength(4); // 1 Header + 3 Data

      const alice = table.getByRole('row').filter({ hasText: 'Alice' });
      await expect.element(alice).not.toBeInTheDocument();
    });
  });

  describe('Custom Rendering', () => {
    test('uses custom cellRenderer', async () => {
      const customColumns = [...getColumns()];
      customColumns[1] = {
        ...customColumns[1],
        cellRenderer: val => `<strong>${val}</strong>`, // Returns HTML string
      };

      const el = await renderTable({ columns: customColumns });
      const table = page.elementLocator(el);

      // Lit renders this as text unless you use the .unsafeHTML directive,
      // but assuming your renderer handles strings or templates:
      const cell = table.getByRole('cell', { name: 'Alice' });

      // Verify the content is what we expect
      await expect.element(cell).toHaveTextContent('<strong>Alice</strong>');
    });

    test('applies custom row parts via rowParts callback', async () => {
      const el = await renderTable({
        rowParts: row => (row.age > 30 ? 'highlight-danger' : ''),
      });

      // Charlie is 35, should have the part
      const charlieRow = page
        .elementLocator(el)
        .getByRole('row')
        .filter({ hasText: 'Charlie' });

      // In Vitest browser, we check the 'part' attribute
      await expect
        .element(charlieRow)
        .toHaveAttribute('part', expect.stringContaining('highlight-danger'));
    });
  });
});
