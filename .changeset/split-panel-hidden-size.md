---
'@timlassiter11/yatl-ui': patch
---

Fixed `yatl-split-panel` (and so `yatl-table-view`'s filters panel) collapsing to 0 when it first renders while hidden, e.g. inside an inactive tab, with `size-policy="fixed"`. The panel now keeps its position until it has a size, and re-clamps whenever its size changes, including window resizes and being shown.
