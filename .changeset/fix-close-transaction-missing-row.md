---
"@timlassiter11/yatl": patch
---

Fixed resolveTransaction/rejectTransaction/discardTransaction throwing if a row was removed by a data reload while its commit was still in flight
