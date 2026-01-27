# YATL (Yet Another Table Library)

[![NPM Version](https://img.shields.io/npm/v/@timlassiter11/yatl)](https://www.npmjs.com/package/@timlassiter11/yatl)
[![API Docs](https://img.shields.io/badge/docs-typedoc-blue)](https://timlassiter11.github.io/YATL/docs/index.html)
[![Live Demo](https://img.shields.io/badge/demo-online-green)](https://timlassiter11.github.io/YATL/examples/index.html)
[![License](https://img.shields.io/npm/l/@timlassiter11/yatl)](LICENSE)

YATL is a powerful, feature-rich, and lightweight Web Component data table built with Lit. It handles large datasets with ease using virtual scrolling, offers advanced fuzzy search capabilities, supports state persistence, and works in any framework (React, Vue, Angular, or Vanilla JS).

## Why?!?

I needed a free and simple table library for vanilla JS that was easy to customize and could handle large datasets... so I created YATL. As the project that I wrote this for grew, so did this library. Now it is a web component built using Lit that is fairly feature rich for simple use cases. There are many other great table libraries out there but if you want something simple to just drop in but with all of the major features already included, YATL might be for you.

## Features

- **Virtual Scrolling**: Render 100,000+ rows smoothly with virtual scrolling.
- **Smart Search**: Tokenized fuzzy search with relevance scoring and highlighting.
- **State Persistence**: Automatically save and restore column order, visibility, sort, and widths to LocalStorage.
- **Highly Customizable**: Slot support, CSS Shadow Parts, and custom cell renderers.
- **Interactive**: Drag-and-drop column reordering, multi-column sorting (`SHIFT+CLICK`), and resizeable headers.
- **Export**: Built-in CSV export for visible or all data.
- **Type Safe**: Generic component with full type hint support.

## Installation

The recommend method is to use npm.

```bash
npm install @timlassiter11/yatl
```

Alternatively you can manually download the source files from the [releases](https://github.com/timlassiter11/YATL/releases) section.

### Lit
```ts
import { html, LitElement } from 'lit';

import '@timlassiter11/yatl';

class MyComponent extends LitElement {
   @state()
   private _tableData: User[] = [];

   private _tableColums: ColumnOptions<User>[] = [
      {
         field: 'id',
         title: 'ID',
         resizeable: true,
         sortable: true,
         searchable: false,
      },
      {
         field: 'name',
         resizeable: true,
         sortable: true,
         searchable: true,
         tokenize: true,
      },
      {
         field: 'status',
         resizeable: true,
         sortable: true,
         searchable: false,
      }
   ];

   protected override render() {
      return html`
        <yatl-table 
          .columns=${this._columns} 
          .data=${this._tableData} 
          enable-virtual-scroll 
          @yatl-row-click=${this.handleRowClicked}>
        </yatl-table>
      `;
   }

   private handleRowClicked = (event) => {
      console.log(event.detail)
   }
}
```

### js

```js
const table = document.querySelector('yatl-table');

table.columns = [
  { field: 'id', title: 'ID', sortable: true, width: 60 },
  { field: 'name', title: 'Name', sortable: true, searchable: true },
  { field: 'role', title: 'Role', sortable: true },
  {
    field: 'status',
    title: 'Status',
    // Custom renderer example
    cellRenderer: value => (value === 'Active' ? '🟢' : '🔴'),
  },
];

table.data = [
  { id: 1, name: 'Alice', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Bob', role: 'User', status: 'Inactive' },
  // ... more data
];
```

### Vanilla JS

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Basic Example</title>
    <style>
      body {
        height: 100vh;
        width: 100vw;
        margin: 0;
        padding: 20px;
        box-sizing: border-box;
      }
    </style>
  </head>

  <body>
    <yatl-table sortable resizable enable-footer></yatl-table>
    <script src="../dist/yatl.min.global.js"></script>
    <script>
      window.addEventListener('load', () => {
        const table = document.querySelector('yatl-table');
        table.columns = [
          {
            field: 'index',
            title: 'ID',
          },
          {
            field: 'name',
          },
          {
            field: 'value',
          },
        ];

        // Generate random rows of data
        table.data = new Array(100).fill(null).map((v, i) => ({
          index: i,
          name: `Row ${i}`,
          value: Math.random() * 1000,
        }));

        table.addEventListener('yatl-row-click', event => {
          console.log(event.detail);
        });
      });
    </script>
  </body>
</html>
```

## Styling

`yatl-table` uses the native Web Component Shadow DOM to encapsulate its styles. This prevents your global CSS from accidentally breaking the table, and prevents the table's styles from leaking out.

To customize the table, you use the standard CSS ::part() pseudo-element.
### The Basics

To style a specific part of the table, select the element and use ::part(name).

```css
/* Target the main table container */
yatl-table::part(table) {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
}

/* Target the header row */
yatl-table::part(header) {
  background-color: #f8fafc;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
}
```


### Part Reference

Here is a list of all exposed parts you can target:

| Part Name         | Description                                       |
|-------------------|---------------------------------------------------|
| table             | The main container grid.                          |
| header            | The container for the header row.                 |
| header-cell       | Individual header cells.                          |
| header-title      | The text span inside a header cell.               |
| header-sort-icon  | The sorting arrow icon.                           |
| header-resizer    | The drag handle for resizing columns.             |
| row               | The container for a data row.                     |
| cell              | Targets all cells (both header and body).         |
| body-cell         | Targets only data cells (not headers).            |
| footer            | The footer container.                             |
| message           | The empty state / no results message container.   |

### Common Recipes
#### Zebra Striping
You can use standard pseudo-classes like :nth-child combined with ::part.

```css
/* Stripe every even row */
yatl-table::part(row):nth-child(even) {
  background-color: #f9f9f9;
}

/* Add a hover effect to rows */
yatl-table::part(row):hover {
  background-color: #e0f2fe;
  cursor: pointer;
}
```

#### Targeting Specific Columns
Every cell automatically gets a part name based on its field property in the format cell-{field}.

For example, if you have a column defined as `{ field: 'status' }`:

```css
/* Center the 'status' column and make it bold */
yatl-table::part(cell-status) {
  justify-content: center; /* Flex alignment */
  font-weight: bold;
  text-align: center;
}

/* Set a specific width or background for the ID column */
yatl-table::part(cell-id) {
  background-color: #f1f5f9;
  font-family: monospace;
}
```

#### Conditional Row Styling

You can style rows based on their data using the rowParts property in JavaScript combined with CSS.

```js
const table = document.querySelector('yatl-table');

// Return a string (or array of strings) to add to the row's parts
table.rowParts = (row) => {
  const parts = [];
  if (row.stock < 5) parts.push('low-stock');
  if (row.price > 1000) parts.push('expensive');
  return parts;
};
```

```css
/* Style rows tagged as 'low-stock' */
yatl-table::part(low-stock) {
  background-color: #fef2f2; /* Light red */
  border-left: 4px solid #ef4444;
}

/* Style rows tagged as 'expensive' */
yatl-table::part(expensive) {
  color: #0f172a;
  font-weight: 600;
}
```

#### Customizing the Footer
```css
yatl-table::part(footer) {
  background-color: #1e293b;
  color: white;
  padding: 1rem;
}
```

### Virtual Scroll

Virtual scrolling is used to render only the rows that are visible (with some extras before and after). This allows the library to support tables with hundreads of thousands of rows without issue. This is done using `lit-virtualizer` and requires it's parent enforce a height. To do this you can simply add a height to the table.

```html
<body>
  <yatl-table style="height: 500px;"></yatl-table>
</body>
```

Most of the time this isn't ideal though and instead we'd like to let the layout work it's magic. To do this, it's best to wrap the table in an element that can enforce a height.

```html
<body style="height: 100vh;">
  <div style="display: flex;">
    <div>... Lot's of cool table controls or filters</div>
    <yatl-table style="flex-grow: 1;"></yatl-table>
    <div>... Some boring footer info or something</div>
  </div>
</body>
```