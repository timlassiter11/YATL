---
'@timlassiter11/yatl-ui': patch
---

Fixed yatl-input and yatl-textarea not displaying their value when set via the `value` attribute (e.g. `<yatl-input value="...">`), while setting the `.value` property directly still worked.
