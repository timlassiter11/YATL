---
'@timlassiter11/yatl-ui': minor
---

New `yatl-time-input`: a time of day typed in parts (hour, minute and AM/PM, in the locale's order and clock) or picked from a list. The value is "HH:MM" in 24 hour time (like a native time input), or "" when empty.

- `min`, `max` and `step` (minutes) limit it and report `rangeUnderflow`, `rangeOverflow` and `stepMismatch`. The minute arrows move by `step`.
- `hour-cycle` (`h12` or `h23`) overrides the locale's clock.
- The clock button lists times every `list-step` minutes (defaults to `step`, or 30) between `min` and `max`. `no-list` hides it.
- Type digits (the next part gets focus when one is full), use the arrow keys to change a part, Backspace to clear it, and Left/Right or the separator key to move. A partly filled time has no value and reports `badInput`.

It's built on a new `YatlSegmentedField` base class for inputs typed in parts. Typing goes through key events, so on phones (where the parts don't bring up a keyboard) the list is the way to pick a time.

Also adds a `clock` icon.
