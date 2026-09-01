---
"@timlassiter11/yatl": patch
---

Fixed displayColumns returning a mutable reference to internal state, allowing moveColumn to corrupt previously-captured references
