---
"@timlassiter11/yatl-ui": patch
---

`yatl-date-grid` (and everything built on it - `yatl-date-picker`, `yatl-date-range-picker`, and their form inputs/filters) no longer always opens on today's month. When the selectable `min`/`max` range doesn't include today, it now opens on the nearest bound instead of a month where every day is disabled; when there's an existing selection, it opens on that month instead. Navigating the calendar is left alone otherwise - reopening or an unrelated re-render won't yank the view back once you've moved around.
