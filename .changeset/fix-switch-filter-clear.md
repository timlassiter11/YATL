---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-switch-filter` re-applying its `onValue`/`offValue` when filters were cleared externally (e.g. via the "Clear Filters" button) if its default toggle position mapped to a defined value - clearing now always results in no filter, while still restoring the switch's initial visual position
