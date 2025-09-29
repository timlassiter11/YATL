import { ColumnOptions, DataTable } from '../src/datatable';

type SampleDataType = {
  id?: number;
  name: string | null;
  city?: string | null;
  age?: number | null;
};

const sampleColumns: ColumnOptions<SampleDataType>[] = [
  { field: 'id', title: 'ID' },
  { field: 'name', title: 'Name' },
  { field: 'age', title: 'Age' },
  { field: 'city', title: 'City' },
];

const sampleData: SampleDataType[] = [
  { id: 1, name: 'Alice', age: 25, city: 'New York' },
  { id: 2, name: 'Bob', age: 30, city: 'Los Angeles' },
  { id: 3, name: 'Charlie', age: 35, city: 'Chicago' },
  { id: 4, name: 'John', age: 25, city: 'Boulder' },
];

const sampleDataWithNulls = [
  { id: 1, name: 'Alice', age: 25, city: 'New York' },
  { id: 2, name: 'Bob', age: null, city: 'Los Angeles' },
  { id: 3, name: 'Charlie', age: 35, city: 'Chicago' },
  { id: 4, name: 'David', age: undefined, city: null },
  { id: 5, name: null, age: 40, city: 'Boulder' },
];

const defaultTestOptions = {
  virtualScroll: false,
};

describe('DataTable', () => {
  let tableElement: HTMLTableElement;

  beforeEach(() => {
    document.body.innerHTML = '<table></table>';
    tableElement = document.querySelector('table')!;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Core', () => {
    let dataTable: DataTable<SampleDataType>;

    beforeEach(() => {
      dataTable = new DataTable<SampleDataType>(tableElement, {
        ...defaultTestOptions,
        columns: sampleColumns,
      });
    });

    it('should initialize with valid table element', () => {
      expect(dataTable.table).toBe(tableElement);
    });

    it('should throw error if invalid selector', () => {
      expect(
        () => new DataTable('#table', { columns: [{ field: 'name' }] }),
      ).toThrow(SyntaxError);
    });

    it('should load data into the table', () => {
      dataTable.loadData([{ id: 1, name: 'Alice' }]);
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].name).toBe('Alice');
    });

    it('should append data', () => {
      dataTable.loadData(sampleData);
      expect(dataTable.rows.length).toBe(sampleData.length);
      dataTable.loadData([{ id: 5, name: 'Jane', age: 55 }], { append: true });
      expect(dataTable.rows.length).toBe(sampleData.length + 1);
    });

    it('should handle undefined data in rows', () => {
      dataTable.loadData([{ id: 1, name: 'Jim' }]);
      expect(dataTable.rows[0].age).toBeUndefined();
    });
  });

  describe('Search', () => {
    type SearchData = { id: number; product?: string; category?: string };

    const searchData: SearchData[] = [
      { id: 1, product: 'Laptop Pro X1', category: 'Electronics' },
      { id: 2, product: 'Laptop Standard', category: 'Electronics' },
      { id: 3, product: 'Pro Coffee Grinder', category: 'Home Goods' },
      { id: 4, product: 'Standard Coffee Filters', category: 'Home Goods' },
    ];

    const searchColumns: ColumnOptions<SearchData>[] = [
      { field: 'product', searchable: true },
      { field: 'category', searchable: true },
    ];

    it('should highlight search results', () => {
      const dataTable = new DataTable(tableElement, {
        ...defaultTestOptions,
        highlightSearch: true,
        columns: searchColumns,
        data: searchData,
      });
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

      const dataTable = new DataTable(tableElement, {
        ...defaultTestOptions,
        columns: columns,
        data,
      });

      dataTable.search('New York');
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].user.name).toBe('Alice');
    });

    it('should handle searching columns with null or undefined values', () => {
      const dataTable = new DataTable(tableElement, {
        ...defaultTestOptions,
        columns: [{ field: 'name', searchable: true }],
        data: sampleDataWithNulls,
        tokenizeSearch: true,
        enableSearchScoring: true, // Test the most complex path
      });
      dataTable.loadData(sampleDataWithNulls);

      // Should not throw an error when processing the null/undefined names
      expect(() => dataTable.search('ali')).not.toThrow();

      // Should correctly find the valid row
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].name).toBe('Alice');
    });

    describe('with simple substring search', () => {
      let dataTable: DataTable<SearchData>;

      beforeEach(() => {
        dataTable = new DataTable(tableElement, {
          ...defaultTestOptions,
          tokenizeSearch: false,
          enableSearchScoring: false,
          columns: searchColumns,
          data: searchData,
        });
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
        dataTable = new DataTable(tableElement, {
          ...defaultTestOptions,
          tokenizeSearch: true,
          enableSearchScoring: false,
          columns: searchColumns,
          data: searchData,
        });
      });

      it('should find rows that match any of the search tokens', () => {
        dataTable.search('laptop coffee');
        expect(dataTable.rows.length).toBe(4);
      });

      it('should use different tokenizer functions', () => {
        const tokenData = [{ tags: 'apple,banana,cherry' }];
        const commaTokenizer = (value: string) =>
          value.split(',').map(token => ({ value: token, quoted: false }));

        const dataTable = new DataTable(tableElement, {
          ...defaultTestOptions,
          columns: [{ field: 'tags', searchable: true, tokenize: true }],
          data: tokenData,
          tokenizeSearch: true,
          tokenizer: commaTokenizer,
        });

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

      let dataTable: DataTable<ScoredSearchData>;

      beforeEach(() => {
        dataTable = new DataTable(tableElement, {
          ...defaultTestOptions,
          columns: [
            //{ field: 'id', searchable: false, tokenize: false},
            { field: 'title', searchable: true, tokenize: true },
          ],
          data: scoredSearchData,
          tokenizeSearch: true,
          enableSearchScoring: true,
        });
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
        const dataTable = new DataTable(tableElement, {
          ...defaultTestOptions,
          columns: [{ field: 'product', searchable: true, tokenize: true }],
          data: [{ product: 'Laptop Pro X1' }],
          tokenizeSearch: true, // Tokenization is ON
        });

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
        dataTable = new DataTable(tableElement, {
          ...defaultTestOptions,
          columns: [
            { field: 'partNumber', searchable: true, tokenize: false }, // Substring search
            { field: 'description', searchable: true, tokenize: true }, // Token search
          ],
          data: tokenizedSearchData,
          tokenizeSearch: true,
        });
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
    let dataTable: DataTable<SampleDataType>;

    beforeEach(() => {
      dataTable = new DataTable(tableElement, {
        ...defaultTestOptions,
        columns: sampleColumns,
        data: sampleData,
      });
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
      dataTable.loadData(sampleDataWithNulls);

      // Should not crash when filtering on a column with nulls
      expect(() => dataTable.filter({ age: 35 })).not.toThrow();
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].name).toBe('Charlie');

      // Should correctly filter for null values
      dataTable.filter({ age: null });
      expect(dataTable.rows.length).toBe(1);
      expect(dataTable.rows[0].name).toBe('Bob');

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
    let dataTable: DataTable<SampleDataType>;

    beforeEach(() => {
      dataTable = new DataTable(tableElement, {
        ...defaultTestOptions,
        columns: sampleColumns,
        data: sampleData,
      });
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

    it('should correctly handle removing a sort from a multi-column sort', () => {
      // 1. Initial sort: Age (asc) -> Name (asc)
      dataTable.sort('age', 'asc');
      dataTable.sort('name', 'asc');

      // Alice (25) and John (25) are sorted by name
      expect(dataTable.rows[0].name).toBe('Alice');
      expect(dataTable.rows[1].name).toBe('John');

      // 2. Remove the sort on "age"
      dataTable.sort('age', null);

      // The only remaining sort is now "name" (asc).
      // The overall order should now be purely alphabetical by name.
      expect(dataTable.rows[0].name).toBe('Alice');
      expect(dataTable.rows[1].name).toBe('Bob');
      expect(dataTable.rows[2].name).toBe('Charlie');
      expect(dataTable.rows[3].name).toBe('John');
    });

    it('should handle null and undefined values, grouping them together', () => {
      // REUSE the dataTable from the Sort's beforeEach
      dataTable.loadData(sampleDataWithNulls);

      // Sort ascending. Nulls/undefineds should typically come first.
      dataTable.sort('age', 'asc');

      const sortedAges = dataTable.rows.map(row => row.age);
      // Note: The exact order of null vs undefined isn't critical,
      // just that they are grouped and don't cause a crash.
      expect(sortedAges.slice(0, 2)).toContain(null);
      expect(sortedAges.slice(0, 2)).toContain(undefined);
      expect(sortedAges.slice(2)).toEqual([25, 35, 40]);
    });
  });

  describe('UI', () => {
    let dataTable: DataTable<SampleDataType>;

    beforeEach(() => {
      dataTable = new DataTable(tableElement, {
        ...defaultTestOptions,
        columns: sampleColumns,
        data: sampleData,
      });
    });

    it('should show and hide columns', () => {
      const nameHeader = document.querySelector(
        'th[data-dt-field="name"]',
      ) as HTMLElement;
      const ageHeader = document.querySelector(
        'th[data-dt-field="age"]',
      ) as HTMLElement;

      expect(nameHeader.style.display);
      //const ageColumn = dataTable.columnStates.find(col => col.field === "age");

      expect(nameHeader.hidden).toBe(false);
      expect(ageHeader.hidden).toBe(false);

      dataTable.hideColumn('age');
      expect(nameHeader.hidden).toBe(false);
      expect(ageHeader.hidden).toBe(true);

      dataTable.showColumn('age');
      expect(nameHeader.hidden).toBe(false);
      expect(ageHeader.hidden).toBe(false);

      // Attempt to hide a non-existent column
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      dataTable.hideColumn('nonexistent');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Attempting to hide non-existent column nonexistent',
      );
      consoleWarnSpy.mockRestore();
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

      const dataTable = new DataTable(tableElement, {
        columns: [
          { field: 'id', title: 'ID' },
          { field: 'name', title: 'Name' },
        ],
        data,
        rearrangeable: true, // Ensure rearrangeable is enabled for the table
        virtualScroll: false,
      });

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

      const dataTable = new DataTable(tableElement, {
        columns: [
          { field: 'name', title: 'Name', sortable: true },
          { field: 'age', title: 'Age', sortable: true },
        ],
        data,
        virtualScroll: false,
      });

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
});
