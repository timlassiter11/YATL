---
'@timlassiter11/yatl-ui': minor
---

`yatl-date-input` and `yatl-date-range-input` can be typed into. They're built on the same segmented field as `yatl-time-input`: month, day and year in the locale's order, with the calendar opened from the icon.

- Dates keep their `Date` values, `min`/`max` and form values.
- A partly typed or impossible date (e.g. February 30) has no value and reports `badInput`.
- Both fire `input` on every edit, and `change` when focus leaves with a different value or a date is picked.
- A range end can be left empty for an open range, as before.

Changes to watch for:

- `yatl-date-input` only shows the calendar's Clear button with the new `clearable` attribute. Backspace clears the typed parts either way. The calendar also has a Today button.
- `placeholder` now defaults to "" and only shows when the input is empty and unfocused (or read-only). Otherwise the parts' hints (e.g. "mm/dd/yyyy") show.
- `yatl-date-range-input`'s `formatter` is only used for a read-only or disabled range now.
- The unused `size` property is gone from both.
