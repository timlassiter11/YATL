# YATL
**Yet Another Table Library**

YATL is a lightweight and customizable JavaScript library for creating dynamic, interactive tables. It provides features like sorting, filtering, searching, and virtual scrolling, making it easy to work with large datasets in a performant way.

## Features
- **Sorting**: Sort table rows by multiple columns (ascending or descending).
- **Filtering**: Filter rows based on multiple criteria or custom filter functions.
- **Searching**: Perform case-insensitive searches across table data with support for tokenization and regular expressions.
- **Virtual Scrolling**: Efficiently render large datasets with virtual scrolling.
- **Customizable Columns**: Define column properties like visibility, formatting, and sorting behavior.
- **Export to CSV**: Export table data to a CSV file.

### Searching
YATL provides a powerful and flexible search feature that allows you to search across table data. Key capabilities include:

1. **Case-Insensitive Search**:
   - By default, searches are case-insensitive, making it easy to find matches regardless of capitalization.

2. **Tokenization**:
   - Columns can be configured to tokenize their values for more advanced search capabilities. For example, a column containing a string like `"John Doe"` can be tokenized into `["john", "doe"]`, allowing partial matches on individual words.
   - Tokenization happens when the data is loaded to help improve performance

3. **Regular Expression Support**:
   - You can use regular expressions to perform complex searches. For example, searching with `/^A/` will match all rows where the search field starts with the letter "A".

4. **Per-Column Searchability**:
   - You can specify which columns are searchable and tokenized by setting their respective property in the column definition. Non-searchable columns will be ignored during searches.


## Installation
Include the library in your project by downloading the source files

### Using `<script>` Tag
```html
<script src="path/to/yatl.js"></script>
```

## Usage
```javascript
// Initialize the DataTable
const dataTable = new DataTable({
    table: "table",
    columns: [
        { field: "name", title: "First Name", sortable: true, searchable: true },
        // Titles will be created from the field name
        { field: "age", sortable: true },
        { field: "city", searchable: true },
    ],
    data: [
        { name: "Alice", age: 25, city: "New York" },
        { name: "Bob", age: 30, city: "Los Angeles" },
        { name: "Charlie", age: 35, city: "Chicago" },
    ],
});

// Sort by age in ascending order
dataTable.sort("age", "asc");

// Filter rows to only people aged 25
dataTable.filter({ age: 25 });

// Filter rows to only people over 25
dataTable.filter((row) => row.age > 25);

// Search for rows containing "Alice"
dataTable.search("bob");

// Export table data to CSV
dataTable.export("my-table-data");

// Example with large dataset and virtual scrolling
const largeData = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  age: Math.floor(Math.random() * 100),
  city: ["New York", "Los Angeles", "Chicago", "Houston"][i % 4],
}));

const dataTable = new DataTable({
  table: document.querySelector("#myTable"),
  columns: [
    { field: "id", title: "ID", sortable: true },
    { field: "name", title: "Name", sortable: true },
    { field: "age", title: "Age", sortable: true },
    { field: "city", title: "City" },
  ],
  data: largeData,
  virtualScroll: 1000, // Enable virtual scrolling if more than 1000 rows
});
```

[Live Examples](https://timlassiter11.github.io/YATL/index.html)
