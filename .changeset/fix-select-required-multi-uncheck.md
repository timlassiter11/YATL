---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-select` with `multi required` blocking unchecking *any* option, even when another option would remain selected - it should only prevent the selection from becoming entirely empty.
