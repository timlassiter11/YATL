import { ColumnOptions, DataTable } from '../data-table';
import { NestedKeyOf } from '../utils';
import { MockVirtualScroll } from '../__mocks__/mock-virtual-scroll';

type SampleData = {
  id: number;
  name: string;
  city?: string | null;
  age?: number | null;
  extra?: string;
};

const sampleColumns: ColumnOptions<SampleData>[] = [
  { field: 'id', title: 'ID' },
  { field: 'name', title: 'Name', searchable: true },
  { field: 'age', title: 'Age' },
  { field: 'city', title: 'City' },
];

const defaultTestOptions = {
  highlightSearch: false,
  virtualScroll: false,
};

describe('DataTable', () => {
  let tableElement: HTMLTableElement;
  let sampleData: SampleData[];

  beforeAll(() => {
    // Mock structuredClone
    global.structuredClone = jest.fn((value: any) => {
      return { ...value };
    });
  });

  beforeEach(() => {
    document.body.innerHTML = '<table></table>';
    tableElement = document.querySelector('table')!;

    sampleData = [
      { id: 1, name: 'Alice', age: 25, city: 'New York' },
      { id: 2, name: 'Bob', age: 30, city: 'Los Angeles' },
      { id: 3, name: 'Charlie', age: 35, city: 'Chicago' },
      { id: 4, name: 'John', age: 25, city: 'Boulder', extra: 'foobar' },
    ];
  });

  describe('Core', () => {
    let dataTable: DataTable<SampleData>;

    beforeEach(() => {
      dataTable = new DataTable<SampleData>(tableElement, sampleColumns, {
        ...defaultTestOptions,
      });
    });

    it('should initialize with valid table element', () => {
      expect(dataTable.table).toBe(tableElement);
    });

    it('should throw error if invalid selector', () => {
      expect(() => new DataTable('#table', [{ field: 'name' }])).toThrow(
        SyntaxError,
      );
    });

    it('should throw an error if invalid element type', () => {
      const element = document.createElement('div') as unknown;
      expect(
        () => new DataTable(element as HTMLTableElement, sampleColumns),
      ).toThrow(TypeError);
    });

    it('should load data into the table', () => {
      dataTable.loadData([{ id: 1, name: 'Alice' }]);
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].name).toBe('Alice');
    });

    it('should append a new row', () => {
      dataTable.loadData(sampleData);
      expect(dataTable.rows.length).toBe(sampleData.length);
      dataTable.loadData([{ id: 5, name: 'Jane', age: 55 }], { append: true });
      expect(dataTable.rows.length).toBe(sampleData.length + 1);
    });

    it('should delete an existing row', () => {
      dataTable.loadData(sampleData);
      dataTable.deleteRow(0);
      expect(dataTable.rows).toHaveLength(sampleData.length - 1);
      expect(dataTable.rows[0].id).toBe(sampleData[1].id);
    });

    it('should update a row with new data', () => {
      dataTable.loadData(sampleData);
      dataTable.updateRow(0, { name: 'test' });
      expect(dataTable.rows[0].name).toBe('test');
    });

    it('should handle undefined data in rows', () => {
      dataTable.loadData([{ id: 1, name: 'Jim' }]);
      expect(dataTable.rows[0].age).toBeUndefined();
    });

    it('should not render any changes when called inside withoutUpdates', () => {
      dataTable.loadData(sampleData);
      dataTable.withoutUpdates(() => {
        dataTable.search('test');
        expect(dataTable.rows).toEqual(dataTable.data);
        dataTable.filter({ age: 0 });
        expect(dataTable.rows).toEqual(dataTable.data);
      });

      expect(dataTable.rows).toHaveLength(0);
    });

    it('should get the correct initial state', () => {
      const state = dataTable.getState();
      expect(state.columns).toHaveLength(sampleColumns.length);
      expect(state.columns[0].field).toBe(sampleColumns[0].field);
      expect(state.columns[0].sortState).toBeNull();
      expect(state.filters).toBeNull();
    });

    it('should get the correct state after changes', () => {
      dataTable.search('test');
      dataTable.filter({ age: 35 });
      dataTable.hideColumn(sampleColumns[0].field);
      dataTable.sort(sampleColumns[1].field, 'asc');

      const state = dataTable.getState();
      expect(state.searchQuery).toBe('test');
      expect((state.filters as any).age).toBe(35);
      expect(state.columns[0].visible).toBeFalsy();
      expect(state.columns[1].sortState?.order).toBe('asc');
      expect(state.columns[1].sortState?.priority).toBe(sampleColumns.length);
    });

    it('should restore the search state', () => {
      const searchQuery = sampleData[1].name!;
      dataTable.loadData(sampleData);
      dataTable.restoreState({ searchQuery });
      expect(dataTable.getState().searchQuery).toBe(searchQuery);
      expect(dataTable.rows).toHaveLength(1);
      expect(dataTable.rows[0].name).toBe(sampleData[1].name);
    });

    it('should restore the filter state', () => {
      const filters = { age: 35 };
      dataTable.loadData(sampleData);
      dataTable.restoreState({ filters });
      expect(dataTable.getState().filters).toEqual(filters);
      expect(dataTable.rows).toHaveLength(1);
      expect(dataTable.rows[0].id).toBe(3);
    });

    it('should restore the column order state', () => {
      const columnOrder: NestedKeyOf<SampleData>[] = [
        'name',
        'age',
        'city',
        'id',
      ];
      dataTable.loadData(sampleData);
      dataTable.restoreState({ columnOrder });
      expect(dataTable.getState().columnOrder).toEqual(columnOrder);

      const titleElements = [...document.querySelectorAll('thead th')];
      const titles = titleElements.map(
        element => (element as HTMLElement).dataset.dtField,
      );
      expect(titles).toEqual(columnOrder);
    });

    it('should restore the column states', () => {
      const columns = dataTable.getState().columns;
      columns[0].sortState = { order: 'asc', priority: 10 };
      columns[1].visible = false;
      dataTable.restoreState({ columns });
      const state = dataTable.getState();
      expect(state.columns).toEqual(columns);
    });

    it('should show and clear a message', () => {
      dataTable.loadData(sampleData);
      dataTable.showMessage('foo');
      expect(document.querySelectorAll('tbody tr')).toHaveLength(1);
      dataTable.clearMessage();
      expect(document.querySelectorAll('tbody tr')).toHaveLength(
        sampleData.length,
      );
    });

    it('should apply custom classes to a message', () => {
      dataTable.showMessage('', 'foo', 'bar');
      const tr = document.querySelector('tbody tr')!;
      expect(tr.classList).toContain('foo');
      expect(tr.classList).toContain('bar');
    });
  });

  describe('Options', () => {
    let dataTable: DataTable<SampleData>;

    beforeEach(() => {
      dataTable = new DataTable(tableElement, sampleColumns, {
        ...defaultTestOptions,
      });
    });

    it('should load data from options', () => {
      dataTable = new DataTable(tableElement, sampleColumns, {
        data: sampleData,
      });
      expect(dataTable.rows).toEqual(sampleData);
    });

    it('should apply user defined classes to HTML elements', () => {
      const data = [{ id: 1, name: 'Alice' }];
      const classes = {
        scroller: 'test-scroller',
        thead: 'test-thead',
        tbody: 'test-tbody',
        tr: 'test-tr',
        th: 'test-th',
        td: 'test-td',
        mark: 'test-mark',
      };
      // We need highlight search for mark to work
      dataTable.updateTableOptions({ highlightSearch: true });
      dataTable.loadData(data);

      dataTable.search(data[0].name);
      dataTable.updateTableOptions({ classes });

      expect(
        document
          .querySelector('.dt-scroller')
          ?.classList.contains(classes.scroller),
      ).toBeTruthy();
      expect(
        document.querySelector('thead')?.classList.contains(classes.thead),
      ).toBeTruthy();
      expect(
        document.querySelector('thead th')?.classList.contains(classes.th),
      ).toBeTruthy();

      expect(
        document.querySelector('tbody')?.classList.contains(classes.tbody),
      ).toBeTruthy();
      expect(
        document.querySelector('tbody tr')?.classList.contains(classes.tr),
      ).toBeTruthy();
      expect(
        document.querySelector('tbody tr td')?.classList.contains(classes.td),
      ).toBeTruthy();

      expect(
        document.querySelector('mark')?.classList.contains(classes.mark),
      ).toBeTruthy();
    });

    it('should mark search text', () => {
      const row = { id: 1, name: 'Alice' };
      dataTable.loadData([row]);
      dataTable.search(row.name);

      dataTable.updateTableOptions({ highlightSearch: true });
      expect(dataTable.tableOptions.highlightSearch).toBe(true);
      expect(document.querySelector('mark')?.innerHTML).toBe(row.name);
      dataTable.updateTableOptions({ highlightSearch: false });
      expect(dataTable.tableOptions.highlightSearch).toBe(false);
      expect(document.querySelector('mark')).toBeNull();
    });

    it('should update no data text', () => {
      const dataTable = new DataTable(
        tableElement,
        [{ field: 'name', searchable: true }],
        {
          ...defaultTestOptions,
        },
      );

      expect(document.querySelector('td')?.innerHTML).toBe(
        dataTable.tableOptions.noDataText,
      );
      dataTable.updateTableOptions({ noDataText: 'testing123' });
      expect(document.querySelector('td')?.innerHTML).toBe('testing123');
    });

    it('should update no match text', () => {
      dataTable.loadData([{ id: 1, name: 'Alice' }]);

      dataTable.search('fjdkajfal');
      expect(document.querySelector('td')?.innerHTML).toBe(
        dataTable.tableOptions.noMatchText,
      );
      dataTable.updateTableOptions({ noMatchText: 'testing123' });
      expect(document.querySelector('td')?.innerHTML).toBe('testing123');
    });

    it('should search extra fields', () => {
      dataTable.loadData(sampleData);
      dataTable.search('foobar');
      expect(dataTable.rows.length).toBe(0);
      dataTable.updateTableOptions({ extraSearchFields: ['extra'] });
      expect(dataTable.rows.length).toBe(1);
    });

    it('should disable search scoring if tokenized search is disabled', () => {
      dataTable.updateTableOptions({
        enableSearchScoring: true,
        tokenizeSearch: true,
      });
      expect(dataTable.tableOptions.enableSearchScoring).toBeTruthy();
      expect(dataTable.tableOptions.tokenizeSearch).toBeTruthy();
      dataTable.updateTableOptions({ tokenizeSearch: false });
      expect(dataTable.tableOptions.enableSearchScoring).toBeFalsy();
    });

    it('should throw an error when getting / settings column options for an invalid column', () => {
      expect(() => dataTable.getColumnOptions('foobar' as any)).toThrow(Error);
      expect(() => dataTable.updateColumnOptions('foobar' as any, {})).toThrow(
        Error,
      );
    });

    it('should update the column title', () => {
      const nameTitleElement = document.querySelector(
        'th[data-dt-field="name"] .dt-header-title',
      )!;
      expect(nameTitleElement.innerHTML).toBe('Name');
      dataTable.updateColumnOptions('name', { title: 'test' });
      expect(nameTitleElement.innerHTML).toBe('test');
    });

    it('should make column searchable', () => {
      dataTable.updateColumnOptions('name', { searchable: false });
      expect(dataTable.getColumnOptions('name').searchable).toBeFalsy();
      dataTable.updateColumnOptions('name', { searchable: true });
      expect(dataTable.getColumnOptions('name').searchable).toBeTruthy();
    });

    it('should make column resizable', () => {
      const headerElement = document.querySelector(`th[data-dt-field="name"]`)!;
      dataTable.updateColumnOptions('name', { resizable: false });
      expect(dataTable.getColumnOptions('name').resizable).toBeFalsy();
      expect(headerElement.classList).not.toContain('dt-resizeable');
      dataTable.updateColumnOptions('name', { resizable: true });
      expect(dataTable.getColumnOptions('name').resizable).toBeTruthy();
      expect(headerElement.classList).toContain('dt-resizeable');
    });

    it('should make column sortable', () => {
      const headerElement = document.querySelector(`th[data-dt-field="name"]`)!;
      dataTable.updateColumnOptions('name', { sortable: false });
      expect(dataTable.getColumnOptions('name').sortable).toBeFalsy();
      expect(headerElement.classList).not.toContain('dt-sortable');
      dataTable.updateColumnOptions('name', { sortable: true });
      expect(dataTable.getColumnOptions('name').sortable).toBeTruthy();
      expect(headerElement.classList).toContain('dt-sortable');
    });

    it('should update the columns value formmatter', () => {
      dataTable.loadData([{ id: 1, name: 'Bobby' }]);
      expect(
        document.querySelector('tbody tr td[data-dt-field="name"]')?.innerHTML,
      ).toBe('Bobby');
      dataTable.updateColumnOptions('name', { valueFormatter: () => 'foobar' });
      expect(
        document.querySelector('tbody tr td[data-dt-field="name"]')?.innerHTML,
      ).toBe('foobar');
    });

    it('should update the columns element formatter', () => {
      dataTable.loadData([{ id: 1, name: 'Bobby' }]);
      expect(
        document.querySelector('tbody tr td[data-dt-field="name"]')?.innerHTML,
      ).toBe('Bobby');
      dataTable.updateColumnOptions('name', {
        elementFormatter: (value, row, element) => {
          element.classList.add('foobar');
          element.innerHTML = 'foobar';
        },
      });

      const cellElement = document.querySelector(
        'tbody tr td[data-dt-field="name"]',
      )!;
      expect(cellElement.classList).toContain('foobar');
      expect(cellElement.innerHTML).toBe('foobar');
    });
  });

  describe('Search', () => {
    type SearchData = {
      id: number;
      product?: string | null;
      category?: string | null;
    };
    const searchColumns: ColumnOptions<SearchData>[] = [
      { field: 'product', searchable: true },
      { field: 'category', searchable: true },
    ];
    let searchData: SearchData[];
    let dataTable: DataTable<SearchData>;

    beforeEach(() => {
      searchData = [
        { id: 1, product: 'Laptop Pro X1', category: 'Electronics' },
        { id: 2, product: 'Laptop Standard', category: 'Electronics' },
        { id: 3, product: 'Pro Coffee Grinder', category: 'Home Goods' },
        { id: 4, product: 'Standard Coffee Filters', category: 'Home Goods' },
      ];
      dataTable = new DataTable(tableElement, searchColumns, {
        ...defaultTestOptions,
      });
      dataTable.loadData(searchData);
    });

    it('should clear search on empty string', () => {
      dataTable.loadData(searchData);
      dataTable.search(searchData[0].product!);
      expect(dataTable.rows).toHaveLength(1);
      dataTable.search('');
      expect(dataTable.rows).toHaveLength(sampleData.length);
    });

    it('should highlight search results', () => {
      dataTable.updateTableOptions({ highlightSearch: true });
      dataTable.search('Standard');
      const firstCell = tableElement.querySelector(
        'td[data-dt-field="product"]',
      ) as HTMLElement;
      expect(firstCell).toBeInstanceOf(HTMLElement);
      expect(firstCell.innerHTML).toContain('<mark');
      expect(firstCell.textContent).toBe('Laptop Standard');
    });

    it('should handle nested data in columns and search', () => {
      type NestedData = { user: { name: string; address: { city: string } } };
      const data: NestedData[] = [
        { user: { name: 'Alice', address: { city: 'New York' } } },
      ];
      const columns: ColumnOptions<NestedData>[] = [
        { field: 'user.name', searchable: true },
        { field: 'user.address.city', searchable: true },
      ];

      const dataTable = new DataTable(tableElement, columns, {
        ...defaultTestOptions,
      });

      dataTable.loadData(data);
      dataTable.search('New York');
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].user.name).toBe('Alice');
    });

    it('should handle searching columns with null or undefined values', () => {
      dataTable.loadData(searchData);
      dataTable.updateRow(0, { product: null });

      // Should not throw an error when processing the null/undefined names
      expect(() => dataTable.search('laptop')).not.toThrow();

      const products = dataTable.rows.map(row => row.product);
      expect(products).not.toContain(null);
    });

    describe('with simple substring search', () => {
      let dataTable: DataTable<SearchData>;

      beforeEach(() => {
        dataTable = new DataTable(tableElement, searchColumns, {
          ...defaultTestOptions,
          tokenizeSearch: false,
          enableSearchScoring: false,
        });
        dataTable.loadData(searchData);
      });

      it('should find rows containing the exact substring case-insensitively', () => {
        dataTable.search('pro');
        expect(dataTable.rows.length).toBe(2);
        expect(dataTable.rows.map(row => row.product)).toEqual([
          'Laptop Pro X1',
          'Pro Coffee Grinder',
        ]);
      });

      it('should search rows with regular expressions', () => {
        dataTable.search(/^Laptop/);
        expect(dataTable.rows.length).toBe(2);
        expect(dataTable.rows.map(row => row.id)).toEqual([1, 2]);
      });

      it('should ignore undefined data in rows', () => {
        dataTable.loadData([{ id: 1, category: 'Home Goods' }]);
        dataTable.search('abcdef');
        expect(dataTable.rows.length).toBe(0);
      });
    });

    describe('with tokenized search', () => {
      let dataTable: DataTable<SearchData>;

      beforeEach(() => {
        dataTable = new DataTable(tableElement, searchColumns, {
          ...defaultTestOptions,
          tokenizeSearch: true,
          enableSearchScoring: false,
        });
        dataTable.loadData(searchData);
      });

      it('should find rows that match any of the search tokens', () => {
        dataTable.search('laptop coffee');
        expect(dataTable.rows.length).toBe(4);
      });

      it('should use different tokenizer functions', () => {
        const tokenData = [{ tags: 'apple,banana,cherry' }];
        const columns: ColumnOptions<(typeof tokenData)[number]>[] = [
          { field: 'tags', searchable: true, tokenize: true },
        ];
        const commaTokenizer = (value: string) =>
          value.split(',').map(token => ({ value: token, quoted: false }));

        const dataTable = new DataTable(tableElement, columns, {
          ...defaultTestOptions,
          tokenizeSearch: true,
          tokenizer: commaTokenizer,
        });
        dataTable.loadData(tokenData);

        dataTable.search('banana');
        expect(dataTable.rows.length).toBe(1);
      });

      it('should treat a quoted phrase as a single substring token', () => {
        dataTable.search('"Pro X1"'); // Note the quotes in the search query
        expect(dataTable.rows.length).toBe(1);
        expect(dataTable.rows[0].product).toBe('Laptop Pro X1');
      });
    });

    describe('with scored and tokenized search', () => {
      type ScoredSearchData = { id: number; title?: string };
      const scoredSearchData: ScoredSearchData[] = [
        { id: 1, title: 'Application' },
        { id: 2, title: 'Apple' },
        { id: 3, title: 'Snapple' },
      ];
      const scoredSearchColumns: ColumnOptions<ScoredSearchData>[] = [
        //{ field: 'id', searchable: false, tokenize: false},
        { field: 'title', searchable: true, tokenize: true },
      ];

      let dataTable: DataTable<ScoredSearchData>;

      beforeEach(() => {
        dataTable = new DataTable(tableElement, scoredSearchColumns, {
          ...defaultTestOptions,
          tokenizeSearch: true,
          enableSearchScoring: true,
        });
        dataTable.loadData(scoredSearchData);
      });

      it('should order results by relevance, placing better matches first', () => {
        dataTable.search('app');
        expect(dataTable.rows.length).toBe(3);
        // "Apple" is closer in length to app so it should be first
        expect(dataTable.rows[0].title).toBe('Apple');
        // "Application" should be second since it's a prefix match
        expect(dataTable.rows[1].title).toBe('Application');
        // "Snapple" should be last since it's a substring match
        expect(dataTable.rows[2].title).toBe('Snapple');
      });

      it('should rank an exact match higher than a prefix match', () => {
        dataTable.search('Apple');
        expect(dataTable.rows.length).toBe(2);
        // "Apple" is an exact match so it should be scored highest.
        expect(dataTable.rows[0].title).toBe('Apple');
        expect(dataTable.rows[1].title).toBe('Snapple');
      });

      it('should bypass tokenization when a RegExp object is passed', () => {
        const data = [{ product: 'Laptop Pro X1' }];
        const columns: ColumnOptions<(typeof data)[number]>[] = [
          { field: 'product', searchable: true, tokenize: true },
        ];
        const dataTable = new DataTable(tableElement, columns, {
          ...defaultTestOptions,
          tokenizeSearch: true, // Tokenization is ON
        });
        dataTable.loadData(data);

        // This regex will only match if it tests against the raw string "Laptop Pro X1",
        // not the individual tokens ['Laptop', 'Pro', 'X1'].
        dataTable.search(/pro x1/i);

        expect(dataTable.rows.length).toBe(1);
      });
    });

    describe('with per-column tokenization', () => {
      type TokenizedSearchData = { partNumber: string; description: string };
      const tokenizedSearchData: TokenizedSearchData[] = [
        { partNumber: 'XYZ-100', description: 'A valuable XYZ part' },
      ];

      let dataTable: DataTable<TokenizedSearchData>;

      beforeEach(() => {
        dataTable = new DataTable(
          tableElement,
          [
            { field: 'partNumber', searchable: true, tokenize: false }, // Substring search
            { field: 'description', searchable: true, tokenize: true }, // Token search
          ],
          {
            ...defaultTestOptions,
            tokenizeSearch: true,
          },
        );

        dataTable.loadData(tokenizedSearchData);
      });

      it('should only match on tokens for columns where tokenization is enabled', () => {
        dataTable.search('part');
        // "part" should match the tokenized description but NOT be found as a substring
        // in the non-tokenized partNumber field.
        expect(dataTable.rows.length).toBe(1);
      });
    });
  });

  describe('Filter', () => {
    let dataTable: DataTable<SampleData>;

    beforeEach(() => {
      dataTable = new DataTable(tableElement, sampleColumns, {
        ...defaultTestOptions,
      });
      dataTable.loadData(sampleData);
    });

    it('should filter rows based on criteria', () => {
      dataTable.filter({ age: 35 });
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].name).toBe('Charlie');
    });

    it('should filter rows based on multiple criteria', () => {
      dataTable.filter({ age: 25, city: 'New York' });
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].name).toBe('Alice');
    });

    it('should return no rows if no match is found', () => {
      dataTable.filter({ age: 40 });
      expect(dataTable.rows.length).toBe(0);
    });

    it('should filter rows using a custom filter function', () => {
      // Custom filter: Only include rows where age is greater than 25
      dataTable.filter((row: any) => row.age > 25);
      expect(dataTable.rows.length).toBe(2);
      expect(dataTable.rows[0].name).toBe('Bob');
      expect(dataTable.rows[1].name).toBe('Charlie');
    });

    it('should reset filters and show all rows', () => {
      dataTable.filter({ age: 453543 });
      expect(dataTable.rows.length).toBe(0);
      // Reset filters
      dataTable.filter({});
      expect(dataTable.rows.length).toBe(dataTable.data.length);
    });

    it('should handle null and undefined values gracefully', () => {
      dataTable.loadData(sampleData);
      dataTable.updateRow(1, { age: null });
      dataTable.updateRow(3, { age: undefined });

      // Should not crash when filtering on a column with nulls
      expect(() => dataTable.filter({ age: 35 })).not.toThrow();
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].name).toBe('Charlie');

      // Should correctly filter for null values
      dataTable.filter({ age: null });
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].name).toBe(sampleData[1].name);

      // Should correctly filter for undefined values
      dataTable.filter({ age: undefined });
      expect(dataTable.rows.length).toBe(1);
    });

    it('should treat arrays as OR filter', () => {
      dataTable.filter({ name: ['Charlie', 'John'] });
      expect(dataTable.rows.length).toBe(2);
    });

    it('should ignore empty arrays', () => {
      dataTable.filter({ name: [] });
      expect(dataTable.rows.length).toBe(sampleData.length);
    });
  });

  describe('Sort', () => {
    let dataTable: DataTable<SampleData>;

    beforeEach(() => {
      dataTable = new DataTable(tableElement, sampleColumns, {
        ...defaultTestOptions,
      });
      dataTable.loadData(sampleData);
    });

    it('should throw an error when trying to sort an invalid column', () => {
      expect(() => dataTable.sort('foobar' as any, null)).toThrow(Error);
    });

    it('should sort rows by column ascending', () => {
      dataTable.sort('age', 'asc');
      expect(dataTable.rows[0].name).toBe('Alice');
      expect(dataTable.rows[1].name).toBe('John');
      expect(dataTable.rows[2].name).toBe('Bob');
      expect(dataTable.rows[3].name).toBe('Charlie');
    });

    it('should sort rows by column descending', () => {
      dataTable.sort('age', 'desc');
      expect(dataTable.rows[0].name).toBe('Charlie');
      expect(dataTable.rows[1].name).toBe('Bob');
      expect(dataTable.rows[2].name).toBe('Alice');
      expect(dataTable.rows[3].name).toBe('John');
    });

    it('should sort rows by multiple columns', () => {
      // Sort by age ascending, then name ascending
      dataTable.sort('age', 'asc');
      dataTable.sort('name', 'asc');

      expect(dataTable.rows[0].name).toBe('Alice');
      expect(dataTable.rows[1].name).toBe('John');
      expect(dataTable.rows[2].name).toBe('Bob');
      expect(dataTable.rows[3].name).toBe('Charlie');
    });

    it('should not update sort priority when changing sort order', () => {
      dataTable.sort('name', 'asc');
      const originalPriority =
        dataTable.getState().columns[1].sortState!.priority;
      dataTable.sort('name', 'desc');
      expect(dataTable.getState().columns[1].sortState!.priority).toEqual(
        originalPriority,
      );
    });

    it('should correctly handle removing a sort from a multi-column sort', () => {
      dataTable.sort('age', 'asc');
      dataTable.sort('name', 'asc');

      expect(dataTable.rows[0].name).toBe('Alice');
      expect(dataTable.rows[1].name).toBe('John');

      dataTable.sort('age', null);

      expect(dataTable.rows[0].name).toBe('Alice');
      expect(dataTable.rows[1].name).toBe('Bob');
      expect(dataTable.rows[2].name).toBe('Charlie');
      expect(dataTable.rows[3].name).toBe('John');
    });

    it('should handle null and undefined values, grouping them together', () => {
      dataTable.loadData(sampleData);
      dataTable.updateRow(1, { age: null });
      dataTable.updateRow(3, { age: undefined });

      // Sort ascending. Nulls/undefineds should typically come first.
      dataTable.sort('age', 'asc');

      const sortedAges = dataTable.rows.map(row => row.age);
      // Note: The exact order of null vs undefined isn't critical,
      // just that they are grouped and don't cause a crash.
      expect(sortedAges.slice(0, 2)).toContain(null);
      expect(sortedAges.slice(0, 2)).toContain(undefined);
      expect(sortedAges.slice(2)).toEqual([25, 35]);
    });
  });

  describe('UI', () => {
    let dataTable: DataTable<SampleData>;

    beforeEach(() => {
      dataTable = new DataTable(tableElement, sampleColumns, {
        ...defaultTestOptions,
      });
      dataTable.loadData(sampleData);
    });

    it('should show and hide columns', () => {
      const nameHeader = document.querySelector(
        'th[data-dt-field="name"]',
      ) as HTMLElement;
      const ageHeader = document.querySelector(
        'th[data-dt-field="age"]',
      ) as HTMLElement;

      expect(nameHeader.style.display);

      expect(nameHeader.hidden).toBe(false);
      expect(ageHeader.hidden).toBe(false);

      dataTable.hideColumn('age');
      expect(nameHeader.hidden).toBe(false);
      expect(ageHeader.hidden).toBe(true);

      dataTable.showColumn('age');
      expect(nameHeader.hidden).toBe(false);
      expect(ageHeader.hidden).toBe(false);
    });

    it('should resize columns by simulating mouse events', () => {
      const nameColumnHeader = tableElement.querySelector(
        'th[data-dt-field="name"]',
      ) as HTMLElement;
      const resizer = nameColumnHeader.querySelector(
        '.dt-resizer',
      ) as HTMLElement;

      const initialWidth = nameColumnHeader.offsetWidth;

      // Simulate mousedown event to start resizing
      resizer.dispatchEvent(new MouseEvent('mousedown', { clientX: 100 }));

      // Simulate mousemove event to resize
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150 }));

      // Simulate mouseup event to stop resizing
      document.dispatchEvent(new MouseEvent('mouseup'));

      expect(nameColumnHeader.style.width).not.toBe(`${initialWidth}px`); // Width should have changed
    });

    it('should reorder columns by simulating drag and drop events', () => {
      const data = [{ id: 1, name: 'Alice' }];

      const dataTable = new DataTable(
        tableElement,
        [
          { field: 'id', title: 'ID' },
          { field: 'name', title: 'Name' },
        ],
        {
          rearrangeable: true, // Ensure rearrangeable is enabled for the table
          virtualScroll: false,
        },
      );
      dataTable.loadData(data);

      const headersBeforeReorder = Array.from(
        tableElement.querySelectorAll('th'),
      ).map(th => (th as HTMLElement).dataset.dtField);
      expect(headersBeforeReorder).toEqual(['id', 'name']);

      dataTable.setColumnOrder(['name', 'id']);

      // Check if the column order has changed
      const headersAfterReorder = Array.from(
        tableElement.querySelectorAll('th'),
      ).map(th => (th as HTMLElement).dataset.dtField);
      expect(headersAfterReorder).toEqual(['name', 'id']);
    });

    it('should refresh the table, reapplying filters and sorting', () => {
      const data = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];

      const dataTable = new DataTable(
        tableElement,
        [
          { field: 'name', title: 'Name', sortable: true },
          { field: 'age', title: 'Age', sortable: true },
        ],
        {
          virtualScroll: false,
        },
      );

      dataTable.loadData(data);

      // Apply a filter and sort
      dataTable.filter({ age: 30 });
      dataTable.sort('name', 'asc');

      expect(dataTable.rows.length).toBe(2);
      expect(dataTable.rows[0].name).toBe('Bob');

      // Call refresh
      dataTable.refresh();
      // Expect the filter and sort to still be applied
      expect(dataTable.rows.length).toBe(2);
      expect(dataTable.rows[0].name).toBe('Bob');
    });
  });

  describe('Virtual Scroll', () => {
    let dataTable: DataTable<SampleData>;

    function generateData(rows: number) {
      const data: SampleData[] = [];
      for (let i = 0; i < rows; ++i) {
        data.push({ id: i, name: `Name ${i}` });
      }
      return data;
    }

    beforeEach(() => {
      tableElement.style.height = '100px';
      dataTable = new DataTable(tableElement, sampleColumns, {
        ...defaultTestOptions,
        virtualScrollClass: MockVirtualScroll,
      });
    });

    it('should render all rows when virtual scroll is disabled', () => {
      const rowCount = 100;
      dataTable.loadData(generateData(rowCount));
      dataTable.updateTableOptions({ virtualScroll: false });
      expect(document.querySelectorAll('tbody tr').length).toBe(rowCount);
    });

    it('should NOT render all rows when virtual scroll is enabled', () => {
      const rowCount = 100;
      dataTable.loadData(generateData(rowCount));
      dataTable.updateTableOptions({ virtualScroll: true });
      // Our mock implementation doesn't actually render anything.
      expect(document.querySelectorAll('tbody tr').length).toBe(0);
    });

    it('should enable virtual scroll when enough rows are present', () => {
      dataTable.updateTableOptions({ virtualScroll: 100 });
      dataTable.loadData(generateData(99));
      expect(document.querySelectorAll('tbody tr').length).toBe(99);
      dataTable.loadData(generateData(1), { append: true });
      // Our mock implementation doesn't actually render anything.
      expect(document.querySelectorAll('tbody tr').length).toBe(0);
    });
  });
});
