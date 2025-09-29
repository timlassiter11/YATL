# YATL
**Yet Another Table Library**

YATL is a lightweight and customizable JavaScript library for creating dynamic, interactive tables. It provides features like sorting, filtering, searching, and virtual scrolling, making it easy to work with large datasets in a performant way.

## Why?!?
I needed a free and simple table library for vanilla JS that was easy to customize and could handle large datasets... so I created YATL. It is designed with performance and simplicity in mind. It has zero dependencies, is incredibly lightweight, and uses a highly efficient virtual scrolling engine to handle massive datasets with ease. If you need a powerful table without the bloat of larger frameworks, YATL is for you.

## Features
- **Sorting**: Sort table rows by multiple columns (ascending or descending).
- **Filtering**: Filter rows based on multiple criteria or custom filter functions.
- **Searching**: Perform case-insensitive searches across table data with support for tokenization and regular expressions.
- **Virtual Scrolling**: Efficiently render large datasets with virtual scrolling.
- **Customizable Columns**: Define column properties like visibility, formatting, and sorting behavior.
- **Export to CSV**: Export table data to a CSV file.

## Installation

The recommend method is to use npm.
```bash
npm install @timlassiter11/yatl
```

Alternatively you can manually download the source files from the [releases](https://github.com/timlassiter11/YATL/releases) section.

### npm
```ts
import { DataTable } from "@timlassiter11/yatl";

const datatble = DataTable("#myTable", {
   ...
});

```

### source (ES6)
```javascript
import { DataTable } from "path/to/datatable.esm.js";

const datatable = new DataTable("#myTable", {
   ...
});
```

### source (UMD)
```html
<script src="path/to/datatable.umd.js"></script>
<script>
   const datatble = new yatl.DataTable("#myTable", {
      ...
   });
</script>
```

## Styling
Some optional styling is included which adds sorting indicators and sticky headers. To use them simply include the stylesheet.

### npm
```ts
import "@timlassiter11/yatl/datatable.css";
```

### source
```html
<link rel="stylesheet" href="path/to/datatable.css">
```

## Usage
```javascript
// Initialize the DataTable
const dataTable = new DataTable("#myTable", {
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

// Search for Bob
dataTable.search("bob");

// Export table data to CSV
dataTable.export("my-table-data");
```

### Virtual Scroll
Virtual scrolling is used to render only the rows that are visible (with some extras before and after). This allows the library to support tables with hundreads of thousands of rows without issue. This is done using some magic (*simple math...*) but requires it's parent enforce a height. To do this you can simply add a height to the table.

```html
<body>
   <table style="height: 500px;"></table>
</body>
```

This will result in the following HTML after the table is initialized
```html
<body>
   <div class="dt-scroller" style="overflow: auto; height: 500px;">
      <table></table>
   </div>
</body>
```

Most of the time this isn't ideal though and instead we'd like to let the layout work it's magic (*probably also simple math...*). To do this, it's best to wrap the table in an element that can enforce a height.

```html
<body style="height: 100vh;">
   <div style="display: flex; flex-direction: column; overflow: auto; height: 100%;">
      <div>
         ... Lot's of cool table controls or filters
      </div>
      <table></table>
      <div>
         ... Some boring footer info or something
      </div>
   </div>
</body>
```

Since the `dt-scroller` wrapper listens to scroll and resize events, this allows the table to be responsive and update what is rendered as the layout changes. 

### Docs
Full API docs can be found [here](https://timlassiter11.github.io/YATL/docs/index.html).

# Known Issues
There are some limitations to virtual scrolling. For one, rows need to be a uniform height to accurately calculate the table height. Also, there seems to be a maximum element size that once exceeded, the contents are no longer rendered. I've found this to occur with datasets approaching 1 million rows in Chrome and unfortunately I have no workaround for it. If you have that many rows you definitely need some server side pagination and this is probably not the library for you.

# Examples
Examples can be found in the examples directoy and are also hosted [here](https://timlassiter11.github.io/YATL/index.html) to view live.
