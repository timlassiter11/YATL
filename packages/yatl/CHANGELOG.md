# @timlassiter11/yatl

## 1.4.0

### Minor Changes

- eae0d78: \* Added dedicated filterStrategy property to table controller for overriding default filter logic with a custom filter function.
  - Removed the option to set the filters to a callback function.

### Patch Changes

- 7a1b276: Added sticky column API methods and events to table controller
- 6475918: Disable cell editing while they are involved in a pending transaction
- 1a6e094: Added native support for Date type filter values
- dc34ff1: Added ability to pin table columns
- bdac051: Fixed table not saving column order
- b334ce9: Added new editTrigger property to the table for controlling how a user initiates cell editing
- 611cfa7: Created new search engine class and moved table controller search logic into that
- a1b6f99: Added CTRL + click on header to pin column to the left of the table
- 61bfcb0: Added new 'primary' option to column definitions to automatically generate composite row IDs
- 2d8acdb: Added new initial state property to table controller options
- b3a378f: Added new respondWith callback to table commit request events for automatically closing the request based on the return
- a559d42: Added transaction API to controller and cell edit states to table UI
- 63fde3d: Fixed table not running custom filter strategy
- f7f1d44: Allow all controller properties to be passed to constructor
- 530ca30: Added new columnOrder property to table and controller
- add530e: Improved drag and drop columns with better drop indicator and logic

## 1.3.0

### Minor Changes

- aebeaae: Improved property names, defaults, and docstrings for table and table controller

### Patch Changes

- 295518a: Fixed bug causing table row click events to fire when a link or button in a cell was clicked
- f32af15: Added ability to edit cells within table
- 56df7fd: Show column title on header hover
- 0aa669c: Allow users to provide storage interface
- 5b489cd: Added print method to table component
- ceae989: Fixed columns missing from storage data not displaying
- 89263d8: Properly handle array values when creating column options
- e1310a0: Added select editor
- 269725b: Added save callback to all cell editors
- 329b84b: Added ability to conditionally disable editing of a single cell in an editable column
- cbef96d: Moved from editable flag to editor interface to allow for custom cell editors
- ea20d98: Only dispatch cell change events when data actually changed
- 2a27505: Fixed table displaying NaN when editing a number cell with an empty value
- 72fa32a: Limit input to range in options when editing a cell with the number editor
- 25eaabb: Added ability to set column data type

## 1.2.5

### Patch Changes

- 84ad70a: Fixed table export including undefined and null values as string literals

## 1.2.4

### Patch Changes

- be235f2: Automatically right align numbers in table
- 885608e: Added new size property to button
- 8b8cf2c: Fixed search and sorting not working when controller data is set before columns
- 52d8fb7: Fixed visual bug when virtualized table is put inside dialog causing rows to be rendered incorrectly

## 1.2.3

### Patch Changes

- 847e4ad: Fixed striped rows jumping when scrolling
- 7b0a774: Fixed inconsistent row borders
- 6f88bea: Allow row and cell parts callbacks to not return anything

## 1.2.2

### Patch Changes

- 92e24e5: Apply color scheme based on root .light or .dark class

## 1.2.1

### Patch Changes

- 4640e98: Fixed column toggle request never firing
- b7a21b7: \* Fixed resize event not firing
  - Fixed unable to prevent row selection
  - Added more event test cases

## 1.2.0

### Minor Changes

- d2a5ab1: - Refactored project into a monorepo
  - Created @timlassiter11/yatl-ui for UI components
