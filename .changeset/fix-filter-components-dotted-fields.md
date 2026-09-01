---
"@timlassiter11/yatl-ui": patch
---

Fixed filter components (`yatl-select-filter`, `yatl-search-filter`, etc.) bound to a dotted/nested `field` (e.g. `field="user.name"`) silently not filtering anything - they were writing a nested object into the controller's `filters`, but `Filters<T>` is a flat map keyed by the dotted field name itself
