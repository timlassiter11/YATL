---
'@timlassiter11/yatl-ui': minor
---

`yatl-button` sizing and `yatl-button-group` size.

- Buttons have more padding at the sides than above and below (small `4px 10px`, medium `8px 14px`, large `12px 20px`), and small buttons use the theme's `--yatl-font-size-s` (now 0.875rem), so they no longer look cramped and heavy. The shared size styles have `--yatl-size-padding-block` and `--yatl-size-padding-inline` for this, with `--yatl-size-padding` combining them. A button holding only an icon keeps the same padding all round, so it stays square. `--yatl-button-padding` still overrides the padding.
- `variant="outline"` now has a 1px border (it had none, so it looked like `plain`). `--yatl-button-border-width` changes it. A neutral outline button uses the normal text color, with the dim neutral color only for its border.
- A start or end icon has a small gap before the text.
- `yatl-button-group` has a `size` that sets the size of all its buttons. Leave it unset to let each button keep its own.
