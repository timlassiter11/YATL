---
'@timlassiter11/yatl-ui': patch
---

Each filter component now declares `value` with its own type (e.g. `string | string[]` for `yatl-select-filter`), so template type checkers like lit-analyzer accept bindings such as `value="active"` instead of reporting them against the base class's generic type. No runtime change.
