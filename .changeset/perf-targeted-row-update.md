---
"@timlassiter11/yatl": patch
---

updateRow/updateRowAtIndex no longer rebuild every row's metadata for a single-row edit - they now only rebuild if the edit actually changes that row's own identity (its primary key or rowIdCallback result), falling back to a fast, targeted update otherwise
