---
"@timlassiter11/yatl": minor
---

Added a `searchSortPriority` property (and matching `search-sort-priority` attribute) to control whether search relevance or the user's active column sort takes priority when ordering rows during a scored search. Defaults to `'score'`, matching existing behavior. Persists via `storageOptions` like other table preferences (`saveSearchSortPriority`, defaulting to on).
