---
'@timlassiter11/yatl': minor
'@timlassiter11/yatl-ui': patch
---

Fixed filter components not working with a starting value.

- `yatl`: `getColumnFilterValues()` takes a new `ignoreOwnFilter` argument that leaves the field's own filter out, so a filter UI can still list every option after one is picked.
- `yatl-ui`: filters now read a `value` attribute (`value="active"`, or JSON for arrays: `value='["a","b"]'`).
- `yatl-ui`: filter options no longer stay empty when a value is set before the data loads, and they keep updating with the data and the other filters after a value is picked.
- `yatl-ui`: the date range filter's selectable range no longer shrinks to the range you picked.
- `yatl-ui`: after the filters are cleared, a switch filter with only an `onValue` now shows off (and one with only an `offValue` shows on), instead of looking on while nothing is filtered.
