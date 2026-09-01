---
'@timlassiter11/yatl-ui': patch
---

Added a shared `initialAttributeValue()` helper on YatlFormControl for reading an attribute's initial value from a `value` field initializer, and switched input, textarea, and radio-group over to it in place of their own ad-hoc versions of the same workaround.
