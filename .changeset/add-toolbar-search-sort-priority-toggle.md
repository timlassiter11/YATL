---
"@timlassiter11/yatl-ui": minor
---

Added a search/sort priority toggle button to `yatl-toolbar` (and, through it, `yatl-table-view`/`yatl-table-ui`) that switches the attached controller's `searchSortPriority` between `'score'` and `'sort'`. It's always visible but disabled unless both a sort and a search are currently active, since the setting has no effect otherwise. Opt out with `hideSearchSortPriorityToggle` (`hide-search-sort-priority-toggle` attribute), defaulting to visible so existing consumers get the feature without any changes.
