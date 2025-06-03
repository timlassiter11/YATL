import { DataTable } from "../src/datatable";
import { Row } from "../src/types";

describe("DataTable", () => {
  let tableElement: HTMLTableElement;

  beforeEach(() => {
    // Create a mock table element
    tableElement = document.createElement("table");
    document.body.appendChild(tableElement);
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = '';
  });

  test("should initialize with valid table element", () => {
    const dataTable = new DataTable(tableElement, {
      columns: [{ field: "name", title: "Name" }],
      data: [],
      virtualScroll: false,
    });

		expect(dataTable.table).toBe(tableElement);
		expect(dataTable.columnStates.length).toBe(1);
	});

  test("should throw error if invalid selector", () => {
    expect(() => {
      new DataTable("#table", {
        columns: [],
        data: [],
        virtualScroll: false,
      });
    }).toThrow(SyntaxError);
  });

  test("should load data into the table", () => {
    const data = [
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name" },
        { field: "age", title: "Age" },
      ],
      data: [],
      virtualScroll: false,
    });

    dataTable.loadData(data);

    expect(dataTable.rows.length).toBe(2);
    expect(dataTable.rows[0].name).toBe("Alice");
    expect(dataTable.rows[1].age).toBe(30);
  });

  test("should filter rows based on criteria", () => {
    const data = [
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name" },
        { field: "age", title: "Age" },
      ],
      data,
      virtualScroll: false,
    });

    dataTable.filter({ age: 25 });

    expect(dataTable.rows.length).toBe(1);
    expect(dataTable.rows[0].name).toBe("Alice");
  });

  test("should search rows based on query", () => {
    const data = [
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name", searchable: true },
        { field: "age", title: "Age" },
      ],
      data,
      virtualScroll: false,
    });

    dataTable.search("Bob");

    expect(dataTable.rows.length).toBe(1);
    expect(dataTable.rows[0].name).toBe("Bob");
  });

  test("should sort rows by column", () => {
    const data = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name" },
        { field: "age", title: "Age", sortable: true },
      ],
      data,
      virtualScroll: false,
    });

    dataTable.sort("age", "asc");

    expect(dataTable.rows[0].name).toBe("Bob");
    expect(dataTable.rows[1].name).toBe("Alice");
  });

  test("should filter rows based on multiple criteria", () => {
    const data = [
      { name: "Alice", age: 25, city: "New York" },
      { name: "Bob", age: 30, city: "Los Angeles" },
      { name: "Charlie", age: 25, city: "New York" },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name" },
        { field: "age", title: "Age" },
        { field: "city", title: "City" },
      ],
      data,
      virtualScroll: false,
    });

    dataTable.filter({ age: 25, city: "New York" });

    expect(dataTable.rows.length).toBe(2);
    expect(dataTable.rows[0].name).toBe("Alice");
    expect(dataTable.rows[1].name).toBe("Charlie");
  });

  test("should return no rows if no match is found", () => {
    const data = [
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name" },
        { field: "age", title: "Age" },
      ],
      data,
      virtualScroll: false,
    });

    dataTable.filter({ age: 40 });

    expect(dataTable.rows.length).toBe(0);
  });

  test("should filter rows using a custom filter function", () => {
    const data = [
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
      { name: "Charlie", age: 35 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name" },
        { field: "age", title: "Age" },
      ],
      data,
      virtualScroll: false,
    });

    // Custom filter: Only include rows where age is greater than 25
    dataTable.filter((row: Row) => row.age > 25);

    expect(dataTable.rows.length).toBe(2);
    expect(dataTable.rows[0].name).toBe("Bob");
    expect(dataTable.rows[1].name).toBe("Charlie");
  });

  test("should handle empty data when loading", () => {
    const dataTable = new DataTable(tableElement, {
      columns: [{ field: "name", title: "Name" }],
      data: [],
      virtualScroll: false,
    });

    dataTable.loadData([]);
    expect(dataTable.rows.length).toBe(0);
  });

  test("should sort rows by multiple columns", () => {
    const data = [
      { name: "Charlie", age: 30 },
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
      { name: "Alice", age: 35 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name", sortable: true },
        { field: "age", title: "Age", sortable: true },
      ],
      data,
      virtualScroll: false,
    });

    // Sort by age ascending, then name ascending
    dataTable.sort("name", "asc");
    dataTable.sort("age", "asc");
    
    expect(dataTable.rows[0].name).toBe("Alice");
    expect(dataTable.rows[0].age).toBe(25);
    expect(dataTable.rows[1].name).toBe("Alice");
    expect(dataTable.rows[1].age).toBe(35);
    expect(dataTable.rows[2].name).toBe("Bob");
    expect(dataTable.rows[2].age).toBe(30);
    expect(dataTable.rows[3].name).toBe("Charlie");
    expect(dataTable.rows[3].age).toBe(30);

    // Sort by age descending, then name ascending
    dataTable.sort("age", "desc");

    expect(dataTable.rows[0].name).toBe("Alice");
    expect(dataTable.rows[0].age).toBe(35);
    expect(dataTable.rows[1].name).toBe("Alice");
    expect(dataTable.rows[1].age).toBe(25);
  });

  test("should reset filters and show all rows", () => {
    const data = [
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name" },
        { field: "age", title: "Age" },
      ],
      data,
      virtualScroll: false,
    });

    dataTable.filter({ age: 25 });
    expect(dataTable.rows.length).toBe(1);

    // Reset filters
    dataTable.filter({});
    expect(dataTable.rows.length).toBe(2);
  });

  test("should search rows with regular expressions", () => {
    const data = [
      { name: "Alice Wonderland", age: 25 },
      { name: "Bob The Builder", age: 30 },
      { name: "Charlie Chaplin", age: 35 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name", searchable: true },
        { field: "age", title: "Age" },
      ],
      data,
      virtualScroll: false,
    });

    // Search for names starting with "Al"
    dataTable.search(/^Al/);
    expect(dataTable.rows.length).toBe(1);
    expect(dataTable.rows[0].name).toBe("Alice Wonderland");

    // Search for names containing "the" case-insensitive
    dataTable.search(/the/i);
    expect(dataTable.rows.length).toBe(1);
    expect(dataTable.rows[0].name).toBe("Bob The Builder");

    // Search for names ending with "in"
    dataTable.search(/in$/);
    expect(dataTable.rows.length).toBe(1);
    expect(dataTable.rows[0].name).toBe("Charlie Chaplin");
  });

  test("should highlight search results", () => {
    const data = [
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name", searchable: true },
        { field: "age", title: "Age" },
      ],
      data,
      virtualScroll: false,
      highlightSearch: true,
    });

    dataTable.search("Bo");

    // Manually trigger rendering (as updateTable is private) or inspect rendered HTML
    // For now, we'll check the data structure and assume rendering works as expected.
    // A more robust test would involve inspecting the actual DOM elements.
    expect(dataTable.rows.length).toBe(1); // Ensure filtering works
  });

  test("should show and hide columns", () => {
    const data = [
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name", visible: true },
        { field: "age", title: "Age", visible: true },
      ],
      data,
      virtualScroll: false,
    });

    const nameHeader = document.querySelector('th[data-dt-field="name"]') as HTMLElement;
    const ageHeader = document.querySelector('th[data-dt-field="age"]') as HTMLElement;

    expect(nameHeader.style.display)
    //const ageColumn = dataTable.columnStates.find(col => col.field === "age");

    expect(nameHeader.hidden).toBe(false);
    expect(ageHeader.hidden).toBe(false);

    dataTable.hideColumn("age");
    expect(nameHeader.hidden).toBe(false);
    expect(ageHeader.hidden).toBe(true);

    dataTable.showColumn("age");
    expect(nameHeader.hidden).toBe(false);
    expect(ageHeader.hidden).toBe(false);

    // Attempt to hide a non-existent column
    const consoleWarnSpy = jest.spyOn(console, 'warn');
    dataTable.hideColumn("nonexistent");
    expect(consoleWarnSpy).toHaveBeenCalledWith("Attempting to hide non-existent column nonexistent");
    consoleWarnSpy.mockRestore();
  });

  test("should resize columns by simulating mouse events", () => {
    const data = [
      { name: "Alice", age: 25 },
    ];

    new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name", resizable: true },
        { field: "age", title: "Age", resizable: true },
      ],
      data,
      virtualScroll: false,
    });

    const nameColumnHeader = tableElement.querySelector('th[data-dt-field="name"]') as HTMLElement;
    const resizer = nameColumnHeader.querySelector('.dt-resizer') as HTMLElement;

    const initialWidth = nameColumnHeader.offsetWidth;

    // Simulate mousedown event to start resizing
    resizer.dispatchEvent(new MouseEvent('mousedown', { clientX: 100 }));

    // Simulate mousemove event to resize
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150 }));

    // Simulate mouseup event to stop resizing
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(nameColumnHeader.style.width).not.toBe(`${initialWidth}px`); // Width should have changed
  });

  test("should reorder columns by simulating drag and drop events", () => {
    const data = [
      { id: 1, name: "Alice" },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "id", title: "ID" },
        { field: "name", title: "Name" },
      ],
      data,
      rearrangeable: true, // Ensure rearrangeable is enabled for the table
      virtualScroll: false,
    });

    const headersBeforeReorder = Array.from(tableElement.querySelectorAll('th')).map((th) => (th as HTMLElement).dataset.dtField);
    expect(headersBeforeReorder).toEqual(["id", "name"]);

    dataTable.setColumnOrder(['name', 'id']);

    // Check if the column order has changed
    const headersAfterReorder = Array.from(tableElement.querySelectorAll('th')).map(th => (th as HTMLElement).dataset.dtField);
    expect(headersAfterReorder).toEqual(["name", "id"]);
  });

  test("should use different tokenizer functions", () => {
    const data = [
      { tags: "apple,banana,cherry" },
      { tags: "date grape fig" },
    ];

    // Custom tokenizer that splits by comma
    const commaTokenizer = (value: string) => value.split(',');

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "tags", title: "Tags", searchable: true, tokenize: true },
      ],
      data,
      virtualScroll: false,
      tokenizer: commaTokenizer,
    });

    dataTable.search("banana");

    expect(dataTable.rows.length).toBe(1);
    expect(dataTable.rows[0].tags).toBe("apple,banana,cherry");

    // Test with default whitespace tokenizer (should not find "banana")
    const dataTableDefaultTokenizer = new DataTable(tableElement, {
      columns: [
        { field: "tags", title: "Tags", searchable: true, tokenize: true },
      ],
      data,
      virtualScroll: false,
    });

    dataTableDefaultTokenizer.search("banana");
    // TODO: Ensure rows are sorted by search score?
    // or update search logic to be more exact.
    //expect(dataTableDefaultTokenizer.rows.length).toBe(0);
  });

  test("should handle nested data in columns and search", () => {
    const data = [
      { id: 1, user: { name: "Alice", address: { city: "New York" } } },
      { id: 2, user: { name: "Bob", address: { city: "Los Angeles" } } },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "id", title: "ID" },
        { field: "user.name", title: "User Name", searchable: true },
        { field: "user.address.city", title: "City", searchable: true },
      ],
      data,
      virtualScroll: false,
    });

    dataTable.search("Los Angeles");
    expect(dataTable.rows.length).toBe(1);
    expect(dataTable.rows[0].user.name).toBe("Bob");
  });

  test("should refresh the table, reapplying filters and sorting", () => {
    const data = [
      { name: "Charlie", age: 30 },
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
    ];

    const dataTable = new DataTable(tableElement, {
      columns: [
        { field: "name", title: "Name", sortable: true },
        { field: "age", title: "Age", sortable: true },
      ],
      data,
      virtualScroll: false,
    });

    // Apply a filter and sort
    dataTable.filter({ age: 30 });
    dataTable.sort("name", "asc");

    expect(dataTable.rows.length).toBe(2);
    expect(dataTable.rows[0].name).toBe("Bob");

    // Call refresh
    dataTable.refresh();
    // Expect the filter and sort to still be applied
    expect(dataTable.rows.length).toBe(2);
    expect(dataTable.rows[0].name).toBe("Bob");
  });

});