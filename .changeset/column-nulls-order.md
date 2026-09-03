---
'@timlassiter11/yatl': minor
---

Added `nullsOrder` to column options, replacing `nullsLast`:

- `'largest'` (default): nulls sort as if they were the greatest value - last in ascending order, first in descending. Matches the previous default behavior.
- `'smallest'`: the opposite - first in ascending order, last in descending.
- `'last'`: always sorted to the end, regardless of sort order. Replaces `nullsLast: true`.
- `'first'`: always sorted to the start, regardless of sort order.

`nullsLast` is deprecated but still honored (as `nullsOrder: 'last'`) when `nullsOrder` isn't set on a column, and will be removed in a future major version.
