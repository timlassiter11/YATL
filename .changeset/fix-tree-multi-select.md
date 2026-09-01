---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-tree` multi-select mode not actually selecting anything - it checked the item's stale, pre-click `selected` value instead of the newly-computed target state when deciding whether to add or remove it from the selection, so clicking an item in `selection-method="multi"` was a no-op.
