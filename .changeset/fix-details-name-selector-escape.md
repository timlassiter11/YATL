---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-details` throwing (via an unhandled rejection in `willUpdate()`) when its `name` attribute contained a double quote - the accordion-grouping query interpolated `name` directly into a CSS attribute selector without escaping.
