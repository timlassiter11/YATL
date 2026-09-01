---
"@timlassiter11/yatl-ui": minor
---

`yatl-date-range-filter` now automatically limits its picker's selectable dates to the actual min/max of the field's data (via the attached table controller), instead of allowing any date to be picked. Like `yatl-select-filter`'s options, the bounds keep tracking whatever other filters are currently active until a start/end date is picked, then freeze so the filter's own selection can't narrow its own bounds.
