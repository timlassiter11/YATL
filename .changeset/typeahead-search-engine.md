---
'@timlassiter11/yatl-ui': minor
---

`yatl-typeahead` can now search more than its label. Set `searchEngine` to your own `YatlSearchEngine` to control which fields are searched and how, the same way `yatl-table` accepts a controller. The typeahead still loads its data into the engine but leaves the engine's fields and options alone. Without one, it searches only `label-field`, as before.

`renderOption` now also receives the option's search result, so custom content can highlight matches in fields other than the label with `highlightText(value, result.matches[field])`.
