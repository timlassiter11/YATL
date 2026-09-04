# @timlassiter11/yatl

## 1.7.0

### Minor Changes

- 29c117d: Added `nullsOrder` to column options, replacing `nullsLast`:

  - `'largest'` (default): nulls sort as if they were the greatest value - last in ascending order, first in descending. Matches the previous default behavior.
  - `'smallest'`: the opposite - first in ascending order, last in descending.
  - `'last'`: always sorted to the end, regardless of sort order. Replaces `nullsLast: true`.
  - `'first'`: always sorted to the start, regardless of sort order.

  `nullsLast` is deprecated but still honored (as `nullsOrder: 'last'`) when `nullsOrder` isn't set on a column, and will be removed in a future major version.

## 1.6.0

### Minor Changes

- 7865c86: Added a public commit API for building a manual "Save"/"Discard" control (e.g. for `commitStrategy: 'batch'`, where nothing otherwise triggers a commit):

  - `requestCommit(): boolean` bundles every currently pending edit into one transaction and fires `yatl-table-commit-request` for it - the same event Enter/Tab/clicking away already dispatch depending on `commitStrategy`. Returns `false` if there was nothing pending.
  - `discardPendingChanges()` reverts every pending edit back to its last-committed value.
  - `hasPendingChanges` reports whether any cell has an uncommitted edit.
  - A new `yatl-table-pending-change` event fires whenever the set of pending edits changes (a field becoming dirty/clean, or a transaction being rejected back into a pending state), so a Save/Discard control can enable itself reactively instead of polling.

  Previously, doing any of this required reaching into `table.controller` and replicating the table's own internal commit-dispatch logic by hand.

### Patch Changes

- c3aa490: Fixed Enter committing an edit even with `commitStrategy: 'batch'`, unlike Tab and clicking away, which already correctly leave the edit pending. Enter now blurs and closes the cell as before, but no longer dispatches a commit in batch mode - the edit stays pending until something explicitly commits it.
- 38a6ab0: Fixed Escape while editing a cell discarding every pending edit in the table instead of just the one being edited. Added `revertPendingChange(row, field)` to the controller as the single-field counterpart to `revertPendingChanges()`.

  Also added the previously-missing `yatl-table-commit` to the `HTMLElementEventMap` type augmentation (and its `@fires` doc on `yatl-table`), so `addEventListener('yatl-table-commit', ...)` is correctly typed as `YatlTableCommitEvent` instead of a bare `Event`.

  `requestCommit()` now warns once to the console if a commit is requested but nothing responds to `yatl-table-commit-request` (matching the existing warn-once pattern for misconfiguration, e.g. duplicate row IDs) - previously the edit just silently reverted to pending with no indication why. The warning, and the updated docs on `requestCommit()`/`yatl-table-commit-request`, also point out `controller.commitChanges()`/`commitAllChanges()` as the escape hatch for consumers who want local-only edits with no backend and no listener at all.

## 1.5.0

### Minor Changes

- cdb336a: Added a `searchSortPriority` property (and matching `search-sort-priority` attribute) to control whether search relevance or the user's active column sort takes priority when ordering rows during a scored search. Defaults to `'score'`, matching existing behavior. Persists via `storageOptions` like other table preferences (`saveSearchSortPriority`, defaulting to on).

### Patch Changes

- a73a20a: getColumnFilterValues() no longer passes flattened array elements to valueFormatter (which formats the whole cell value, not one element) - added an array-safe filterOptionFormatter column option for formatting individual flattened option labels
- 1ff2fe4: Fixed resolveTransaction/rejectTransaction/discardTransaction throwing if a row was removed by a data reload while its commit was still in flight
- 7c81808: Fixed commitChanges/commitAllChanges leaving stale pending-edit state after committing a change
- 7c81808: Fixed commitChanges not refreshing the cached sort value for a committed field, leaving sort order stale after an edit
- 13c8880: Fixed CSV export producing malformed output for values or column titles containing more than one double-quote character, and for headers containing commas or quotes at all
- 8e7c615: Fixed deleteRowAtIndex deleting the wrong rows when passed multiple indices, since removing an earlier index shifted the positions of later ones before they were processed
- 7c81808: Fixed displayColumns returning a mutable reference to internal state, allowing moveColumn to corrupt previously-captured references
- 7c81808: Fixed the cell editor's auto-select misbehaving because focus detection didn't account for the component's shadow DOM
- 7c81808: Fixed hiding a sorted column not updating the table's row order
- 7c81808: Fixed filters not matching on nested (dotted-path) fields
- 7c81808: Fixed cell edits not updating the table's dirty indicator until an unrelated re-render occurred
- 7c81808: Fixed print() leaking the temporary print table as a permanent host on the shared controller
- 7c81808: Fixed a background data reload not reconciling removed rows, causing commitAllChanges/revertPendingChanges to throw
- 7c81808: Fixed revertPendingChanges leaking internal edited-row tracking state
- f2eb73d: scrollToFilteredIndex() no longer silently no-ops when virtual scroll is disabled - the non-virtualized fallback was looking up rows by a `data-filtered-index` attribute that was never actually rendered onto any row, so it could never find its target; it now uses `data-row-id`, which is. Also documented the known limitation where, with virtual scroll enabled, scrolling to a far-away index can visibly undershoot before settling, due to how lit-labs/virtualizer estimates unmeasured row heights.
- 2f6129e: scrollToPx() now actually scrolls the table - it was setting scrollTop on the outer .table element (overflow: hidden, never scrolls) or the lit-virtualizer host (only a scroll container when its scroller property is set, which we don't do) instead of .scroller, the element that actually scrolls
- 91eb0d0: Fixed tokenized search hanging indefinitely when the query contained an empty quoted segment (e.g. "")
- 7c81808: Fixed pending cell edits not supporting an explicitly cleared (undefined) value
- 4cf95fa: Sort values are now computed lazily, only for columns actually being sorted by, instead of eagerly for every column on every data or column change - significantly reducing the cost of loading or reloading large datasets, especially with many columns
- 7c81808: Reduced redundant data copies and per-column allocations on every table render for better performance with large datasets
- 91eb0d0: Reduced redundant field-getter calls during search for better performance with custom column getters
- ffd84da: updateRow/updateRowAtIndex no longer rebuild every row's metadata for a single-row edit - they now only rebuild if the edit actually changes that row's own identity (its primary key or rowIdCallback result), falling back to a fast, targeted update otherwise

## 1.4.2

### Patch Changes

- 5cb2c4c: Fixed row click events firing when clicking to edit cells

## 1.4.1

### Patch Changes

- 668410d: Fixed table displying two row selection checkboxes

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
- eca2858: Fixed bug causing no filter values on array based fields
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
