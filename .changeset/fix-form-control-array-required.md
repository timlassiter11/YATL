---
"@timlassiter11/yatl-ui": patch
---

Fixed `required` validation never triggering on form controls whose value is an array (`yatl-select` in multi mode, `yatl-search-select`) - `!this.value` is always `false` for an array regardless of whether it's empty, so `checkValidity()`/`reportValidity()` always reported valid even with nothing selected.
