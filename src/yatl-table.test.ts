import {
  html,
  fixture,
  expect,
  elementUpdated,
  nextFrame,
} from '@open-wc/testing';
import { stub, spy, useFakeTimers } from 'sinon';
import './yatl-table';
import { type YatlTable } from './yatl-table';
import type { ColumnOptions, NestedKeyOf, RestorableTableState } from './types';
import { findColumn } from './utils';

// --- Mock Data ---
interface User {
  id: number;
  name: string;
  role: string;
  age: number;
  email: string | null;
}

const COLUMNS: ColumnOptions<User>[] = [
  { field: 'id', title: 'ID', sortable: true, resizable: true },
  {
    field: 'name',
    title: 'Name',
    sortable: true,
    searchable: true,
    tokenize: true,
    resizable: true,
  },
  {
    field: 'role',
    title: 'Role',
    sortable: true,
    searchable: true,
    resizable: true,
  },
  { field: 'age', title: 'Age', sortable: true, resizable: true },
  {
    field: 'email',
    title: 'Email',
    sortable: true,
    searchable: true,
    resizable: true,
  },
];

const DATA: User[] = [
  {
    id: 1,
    name: 'Alice Smith',
    role: 'Admin',
    age: 30,
    email: 'alice@example.com',
  },
  { id: 2, name: 'Bob Jones', role: 'User', age: 25, email: 'bob@example.com' },
  { id: 3, name: 'Charlie Day', role: 'User', age: 35, email: null },
  {
    id: 4,
    name: 'David Smith',
    role: 'Manager',
    age: 40,
    email: 'david@test.com',
  },
];

describe('YatlTable', () => {
  let el: YatlTable<User>;

  async function createTable(
    data = DATA,
    columns = COLUMNS,
    props: Partial<YatlTable<User>> = {},
  ) {
    const element = await fixture<YatlTable<User>>(html`
      <yatl-table></yatl-table>
    `);
    element.columns = columns;
    element.data = data;

    // Apply optional props
    Object.assign(element, props);

    await elementUpdated(element);
    return element;
  }

  // --- Basic Rendering ---
  describe('Rendering', () => {
    it('renders the correct number of rows and headers', async () => {
      el = await createTable();

      const headers = el.shadowRoot!.querySelectorAll('.header .cell');
      const rows = el.shadowRoot!.querySelectorAll('.row:not(.header)');

      expect(headers.length).to.equal(5);
      expect(rows.length).to.equal(4);
    });

    it('displays the empty message when no data exists', async () => {
      el = await createTable([]);
      const message = el.shadowRoot!.querySelector('.message');
      expect(message).to.exist;
      expect(message!.textContent).to.contain(el.emptyMessage);
    });

    it('renders null values with the placeholder', async () => {
      el = await createTable();
      // Charlie (index 2) has null email (column index 4)
      const rows = el.shadowRoot!.querySelectorAll('.row:not(.header)');
      const emailCell = rows[2].querySelectorAll('.cell')[4];

      expect(emailCell.textContent).to.contain('-');
    });
  });

  // --- 2. Sorting Logic ---
  describe('Sorting', () => {
    it('sorts numbers correctly (Asc/Desc)', async () => {
      el = await createTable();

      // Sort Age Ascending
      el.sort('age', 'asc');
      await elementUpdated(el);

      let rows = el.shadowRoot!.querySelectorAll('.row:not(.header)');
      let firstRowAge = rows[0].querySelectorAll('.cell')[3].textContent;
      expect(firstRowAge).to.contain('25'); // Bob

      // Sort Age Descending
      el.sort('age', 'desc');
      await elementUpdated(el);

      rows = el.shadowRoot!.querySelectorAll('.row:not(.header)');
      firstRowAge = rows[0].querySelectorAll('.cell')[3].textContent;
      expect(firstRowAge).to.contain('40'); // David
    });

    it('handles interaction: Click to sort, Shift+Click to multisort', async () => {
      el = await createTable();

      // Click "Role" (index 2)
      const roleHeader = el.shadowRoot!.querySelectorAll(
        '.header-content',
      )[2] as HTMLElement;
      roleHeader.click(); // Role ASC
      await elementUpdated(el);

      // Shift+Click "Age" (index 3)
      const ageHeader = el.shadowRoot!.querySelectorAll(
        '.header-content',
      )[3] as HTMLElement;
      ageHeader.dispatchEvent(
        new MouseEvent('click', { bubbles: true, shiftKey: true }),
      );
      await elementUpdated(el);

      const states = el.columnSort;

      // Verify both are sorted
      expect(findColumn('role', states)?.sort).to.exist;
      expect(findColumn('age', states)?.sort).to.exist;
    });

    it('replaces sort when clicking without Shift', async () => {
      el = await createTable();

      el.sort('role', 'asc');
      await elementUpdated(el);

      // Click "Age" without shift
      const ageHeader = el.shadowRoot!.querySelectorAll(
        '.header-content',
      )[3] as HTMLElement;
      ageHeader.click();
      await elementUpdated(el);

      const states = el.columnSort;
      expect(findColumn('role', states)!.sort).to.be.null;
      expect(findColumn('age', states)?.sort?.order).to.equal('asc');
    });
  });

  // --- Filtering & Search ---
  describe('Filtering & Search', () => {
    it('filters rows based on searchQuery', async () => {
      el = await createTable();

      el.searchQuery = 'Smith';
      await elementUpdated(el);

      const rows = el.shadowRoot!.querySelectorAll('.row:not(.header)');
      expect(rows.length).to.equal(2); // Alice Smith, David Smith
    });

    it('supports search tokenization', async () => {
      el = await createTable();
      el.enableSearchTokenization = true;

      // "Alice" matches row 1, "Manager" matches row 4
      el.searchQuery = 'Alice Manager';
      await elementUpdated(el);

      const rows = el.shadowRoot!.querySelectorAll('.row:not(.header)');
      expect(rows.length).to.equal(2);
    });

    it('supports complex functional filters', async () => {
      el = await createTable();

      // Filter: Age > 30 OR ID === 1
      el.filters = row => row.age > 30 || row.id === 1;
      await elementUpdated(el);

      const rows = el.shadowRoot!.querySelectorAll('.row:not(.header)');
      // Should keep: Alice (id 1), Charlie (age 35), David (age 40). Bob (25) excluded.
      expect(rows.length).to.equal(3);
    });

    it('highlights matched text with <mark> tags', async () => {
      el = await createTable();
      el.searchQuery = 'Bob';
      await elementUpdated(el);

      const cell = el.shadowRoot!.querySelector(
        '.row:not(.header) .cell[data-field="name"] mark',
      );
      expect(cell).to.not.be.null;
      expect(cell!.textContent).to.contain('Bob');
    });
  });

  // --- Row Operations ---
  describe('Row Manipulation', () => {
    it('finds original index correctly', async () => {
      el = await createTable();
      // Sort it to mix up the visual order
      el.sort('age', 'asc');
      await elementUpdated(el);

      const idx = el.findRowIndex('name', 'Charlie Day');
      expect(idx).to.equal(2); // The index in the original DATA array
    });

    it('updates a row and refreshes the view', async () => {
      el = await createTable();

      el.updateRow(0, { name: 'Alice Updated' });
      await elementUpdated(el);

      const firstCell = el.shadowRoot!.querySelector(
        '.row:not(.header) .cell[data-field="name"]',
      );
      expect(firstCell!.textContent).to.contain('Alice Updated');
    });

    it('deletes a row', async () => {
      el = await createTable();
      const initialLen = el.data.length;

      el.deleteRow(0);
      await elementUpdated(el);

      expect(el.data.length).to.equal(initialLen - 1);
      const rows = el.shadowRoot!.querySelectorAll('.row:not(.header)');
      expect(rows.length).to.equal(3);
    });
  });

  // --- Column Operations ---
  describe('Column Operations', () => {
    it('toggles column visibility', async () => {
      el = await createTable();

      el.hideColumn('email');
      await elementUpdated(el);

      const headers = el.shadowRoot!.querySelectorAll('.header .cell');
      expect(headers.length).to.equal(4); // 5 - 1

      // Check state
      const state = el.getState().columns.find(c => c.field === 'email');
      expect(state!.visible).to.be.false;
    });

    it('reorders columns via API', async () => {
      el = await createTable();

      // Move 'age' to the front
      el.columnOrder = ['age', 'id', 'name', 'role', 'email'];
      await elementUpdated(el);

      const headers = el.shadowRoot!.querySelectorAll('.header .cell');
      expect(headers[0].textContent).to.contain('Age');
    });

    it('resizes column on drag', async () => {
      el = await createTable();
      const resizer = el.shadowRoot!.querySelector('.resizer') as HTMLElement;
      const initialWidth = el
        .shadowRoot!.querySelectorAll('.header .cell')[0]
        .getBoundingClientRect().width;

      // Mouse Down
      resizer.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          composed: true,
          clientX: 100,
        }),
      );

      // Mouse Move (global window)
      window.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 150, // +50px
        }),
      );

      await nextFrame(); // Let animation frame fire

      // Mouse Up
      window.dispatchEvent(new MouseEvent('mouseup'));
      await elementUpdated(el);

      // Verify state updated
      const colState = findColumn('id', el.columnWidths)
      // Note: Exact pixel match depends on test runner viewport,
      // usually we assert it is LARGER than initial.
      expect(colState!.width).to.be.greaterThan(initialWidth);
    });
  });

  // --- State Persistence ---
  describe('State Persistence', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      clock = useFakeTimers();
      localStorage.clear();
    });

    afterEach(() => {
      clock.restore();
    });

    it('saves state to localStorage after debounce', async () => {
      const storageKey = 'test-table-v1';
      el = await createTable(DATA, COLUMNS, {
        storageOptions: { key: storageKey, saveColumnOrder: true },
      });

      const newOrder: NestedKeyOf<User>[] = [
        'name',
        'age',
        'id',
        'email',
        'role',
      ];
      // Trigger a change
      el.columnOrder = newOrder;
      await elementUpdated(el);

      // Fast forward time past debounce (1000ms)
      clock.tick(1100);

      const stored = localStorage.getItem(storageKey);
      expect(stored).to.not.be.null;

      const parsed = JSON.parse(stored!);
      expect(parsed.columnOrder).to.deep.equal(newOrder);
    });

    it('restores state on initialization', async () => {
      const storageKey = 'test-table-v1';
      const restoreOrder: NestedKeyOf<User>[] = [
        'age',
        'email',
        'id',
        'role',
        'name',
      ];
      const savedState: RestorableTableState<User> = {
        columnOrder: restoreOrder,
      };
      localStorage.setItem(storageKey, JSON.stringify(savedState));

      // Create new table
      el = await createTable(DATA, COLUMNS, {
        storageOptions: { key: storageKey, saveColumnOrder: true },
      });

      expect(el.getState().columnOrder).to.deep.equal(restoreOrder);
      const headers = el.shadowRoot!.querySelectorAll('.header .cell');
      expect(headers[0].textContent).to.contain('Age');
    });
  });

  // --- Events ---
  describe('Events', () => {
    it('dispatches row click event with correct detail', async () => {
      el = await createTable();

      const listener = spy();
      el.addEventListener('yatl-row-click', listener);

      const firstRow = el.shadowRoot!.querySelector(
        '.row:not(.header)',
      ) as HTMLElement;
      // Click on the second cell (Name)
      const nameCell = firstRow.querySelectorAll('.cell')[1] as HTMLElement;
      nameCell.click();

      expect(listener).to.have.been.calledOnce;
      const event = listener.firstCall.args[0] as CustomEvent;

      expect(event.detail.row.id).to.equal(1);
      expect(event.detail.field).to.equal('name');
    });

    it('dispatches sort event when sorting', async () => {
      el = await createTable();

      const listener = spy();
      el.addEventListener('yatl-sort', listener);

      el.sort('age', 'asc');

      expect(listener).to.have.been.calledOnce;
      expect(listener.firstCall.args[0].detail).to.deep.include({
        field: 'age',
        order: 'asc',
      });
    });
  });

  // --- Export CSV ---
  describe('Export', () => {
    it('generates a CSV download', async () => {
      el = await createTable();

      // Stub URL and DOM creation
      const createObjURLStub = stub(URL, 'createObjectURL').returns(
        'blob:test',
      );
      const revokeObjURLStub = stub(URL, 'revokeObjectURL');
      const clickSpy = spy();
      const createElementStub = stub(document, 'createElement').callsFake(
        tag => {
          if (tag === 'a') {
            return {
              style: {},
              click: clickSpy,
              remove: () => {},
              setAttribute: () => {},
            } as unknown as HTMLElement;
          }
          return document.createElement(tag);
        },
      );

      try {
        el.export('my-data');

        expect(createObjURLStub).to.have.been.called;
        expect(clickSpy).to.have.been.called;

      } finally {
        createObjURLStub.restore();
        revokeObjURLStub.restore();
        createElementStub.restore();
      }
    });
  });
});
