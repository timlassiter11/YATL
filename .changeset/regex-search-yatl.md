---
'@timlassiter11/yatl': minor
---

Added regex search. Search queries starting with `\r/` are treated as regular expressions using the `\r/pattern/flags` syntax, with match highlighting and scored search support. Also exports `parseSearchQuery` and `REGEX_SEARCH_PREFIX`.
