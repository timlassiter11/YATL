---
'@timlassiter11/yatl-ui': major
---

Form controls have a `size` (`small`, `medium` or `large`) like buttons, and a control is the same height as a button of the same size.

- **Breaking:** `yatl-input` and `yatl-number-input` used `size` for their width in characters. That's now `chars` (`<yatl-input chars="6">`). `chars` also works on an editable `yatl-number-input` now, where the native `size` was ignored.
- `size` is on `yatl-input` (and `yatl-typeahead`), `yatl-number-input`, `yatl-select`, `yatl-textarea`, `yatl-date-input`, `yatl-date-range-input` and `yatl-time-input`. It sets the text size, the padding and the height, using the shared size styles.
- The height is the line height plus the block padding plus the border, the same as a button. Medium inputs are a few pixels shorter than the old fixed 42px. `--yatl-input-height` still overrides it.
- `--yatl-input-font-size` works now (the text was always `large` before), and inputs default to the size's font size.
- Every `yatl-button` has a border, clear unless it's an outline, so all variants are the same height. The button's background is on the host so it shows under the clear border, and an icon-only button is at least a line of text tall.
- The shared size styles add `--yatl-size-line-height` (1.2) and `--yatl-size-border-width` (1px).
