import { DataTable } from "./datatable";

describe("DataTable", () => {
	let tableElement;

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
		const dataTable = new DataTable({
			table: tableElement,
			columns: [{ field: "name", title: "Name" }],
			data: [],
		});

		expect(dataTable.table).toBe(tableElement);
		expect(dataTable.columns.length).toBe(1);
	});

	test("should throw error if table is null", () => {
		expect(() => {
			new DataTable({
				table: null,
				columns: [],
				data: [],
			});
		}).toThrow(TypeError);
	});

	test("should throw error if invalid selector", () => {
		expect(() => {
			new DataTable({
				table: "#table",
				columns: [],
				data: [],
			});
		}).toThrow(SyntaxError);
	});

	test("should load data into the table", () => {
		const data = [
			{ name: "Alice", age: 25 },
			{ name: "Bob", age: 30 },
		];

		const dataTable = new DataTable({
			table: tableElement,
			columns: [
				{ field: "name", title: "Name" },
				{ field: "age", title: "Age" },
			],
			data: [],
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

		const dataTable = new DataTable({
			table: tableElement,
			columns: [
				{ field: "name", title: "Name" },
				{ field: "age", title: "Age" },
			],
			data,
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

		const dataTable = new DataTable({
			table: tableElement,
			columns: [
				{ field: "name", title: "Name", searchable: true },
				{ field: "age", title: "Age" },
			],
			data,
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

		const dataTable = new DataTable({
			table: tableElement,
			columns: [
				{ field: "name", title: "Name" },
				{ field: "age", title: "Age", sortable: true },
			],
			data,
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

		const dataTable = new DataTable({
			table: tableElement,
			columns: [
				{ field: "name", title: "Name" },
				{ field: "age", title: "Age" },
				{ field: "city", title: "City" },
			],
			data,
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

		const dataTable = new DataTable({
			table: tableElement,
			columns: [
				{ field: "name", title: "Name" },
				{ field: "age", title: "Age" },
			],
			data,
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

		const dataTable = new DataTable({
			table: tableElement,
			columns: [
				{ field: "name", title: "Name" },
				{ field: "age", title: "Age" },
			],
			data,
		});

		// Custom filter: Only include rows where age is greater than 25
		dataTable.filter((row) => row.age > 25);

		expect(dataTable.rows.length).toBe(2);
		expect(dataTable.rows[0].name).toBe("Bob");
		expect(dataTable.rows[1].name).toBe("Charlie");
	});

	test("should reset filters and show all rows", () => {
		const data = [
			{ name: "Alice", age: 25 },
			{ name: "Bob", age: 30 },
		];

		const dataTable = new DataTable({
			table: tableElement,
			columns: [
				{ field: "name", title: "Name" },
				{ field: "age", title: "Age" },
			],
			data,
		});

		dataTable.filter({ age: 25 });
		expect(dataTable.rows.length).toBe(1);

		// Reset filters
		dataTable.filter({});
		expect(dataTable.rows.length).toBe(2);
	});
});
