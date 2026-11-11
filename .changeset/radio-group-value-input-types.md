---
'@timlassiter11/yatl-ui': patch
---

- `yatl-radio-group`: setting `value` from code after the first render now checks the matching radio. Before, the radios kept the old selection until a click or a slot change.
- `yatl-input`: `type` accepts `date` and `time`, for the browser's native pickers, without a type error.
