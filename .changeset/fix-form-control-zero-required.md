---
"@timlassiter11/yatl-ui": patch
---

Fixed `required` validation incorrectly treating `0` as a missing value on `yatl-number-input` - `checkValidity()` reported invalid even when a legitimate value of `0` was set.
