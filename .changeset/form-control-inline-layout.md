---
'@timlassiter11/yatl-ui': major
---

Reworked the shared form control layout so `inline` means what it says: the label sits beside the input, and the hint and error text stay *under the input* instead of running inline next to the label (or, for the hint, beside the control). The label and input are now a two column grid, so the hint and error line up with the input's left edge whatever the width of the label, and a long label wraps (it's capped at half the control's width) rather than squeezing the input. Checkbox, switch and radio keep their control-before-label layout, with the hint below the control.

This also fixes a few things that fell out of the old layout:

- `yatl-select`, `yatl-date-input`, `yatl-date-range-input` and `yatl-search-select` now fill the space the label leaves when `inline`, instead of shrinking to their content (a select could collapse to just its arrow).
- `yatl-radio-group` with `inline` puts its label beside the radios, with the hint and error under them.
- `yatl-switch` and `yatl-radio` now show a focus ring when focused with the keyboard.

**Breaking: the `base` and `input` CSS parts changed meaning** on every form control, so anything using `::part(base)` or `::part(input)` on one needs updating:

- `base` is now the row holding the label and the input. It used to be the input box.
- `input` is now the input box (for `yatl-radio-group`, the list of radios). It used to be the native `<input>` or `<textarea>`, which no longer has a part. `yatl-date-input` and `yatl-date-range-input` expose their trigger button as `input` rather than `base`.
- `yatl-select` exposes its displayed value as a new `value` part.
