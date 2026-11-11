---
'@timlassiter11/yatl-ui': minor
---

New `yatl-time-input`: a time of day typed in parts (hour, minute and AM/PM, in the locale's order and clock) or picked from columns. The value is "HH:MM" in 24 hour time (like a native time input), or "" when empty.

- `min`, `max` and `step` (minutes) limit it and report `rangeUnderflow`, `rangeOverflow` and `stepMismatch`. The minute arrows move by `step`.
- `hour-cycle` (`h12` or `h23`) overrides the locale's clock. It only changes how the time is shown; the value is always 24 hour.
- The clock button opens a picker with a column each for the hour, the minute (every `step` minutes) and AM/PM, like a native time picker. The selected time sits in the middle row and long columns wrap around (23, 00, 01). Spin a column with the mouse wheel, its arrows, the keyboard or a touch drag, or click a time. Hours outside `min` and `max` are disabled. `no-picker` hides the button.
- Type digits (the next part gets focus when one is full), use the arrow keys to change a part, Backspace to clear it, and Left/Right or the separator key to move. A partly filled time has no value and reports `badInput`.

It's built on a new `YatlSegmentedField` base class for inputs typed in parts. Typing goes through key events, so on phones (where the parts don't bring up a keyboard) the picker is the way to pick a time.

The picker is also its own element, `yatl-time-picker` (`value`, `hour-cycle`, `step`, `min`, `max`). Up and Down change the focused column, Left and Right move between columns, and Enter fires `done`.

Also adds a `clock` icon.
