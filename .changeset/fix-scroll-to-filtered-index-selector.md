---
"@timlassiter11/yatl": patch
---

scrollToFilteredIndex() no longer silently no-ops when virtual scroll is disabled - the non-virtualized fallback was looking up rows by a `data-filtered-index` attribute that was never actually rendered onto any row, so it could never find its target; it now uses `data-row-id`, which is. Also documented the known limitation where, with virtual scroll enabled, scrolling to a far-away index can visibly undershoot before settling, due to how lit-labs/virtualizer estimates unmeasured row heights.
