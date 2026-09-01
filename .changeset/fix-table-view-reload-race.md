---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-table-view` reload requests racing: since the reload button always calls `reloadData` silently and is never disabled mid-flight, rapid clicks could start overlapping fetches, and a slower/older request finishing after a newer one could overwrite fresher data (or clear the loading indicator while a newer reload was still in flight). Only the most recently started reload's result is now applied.
