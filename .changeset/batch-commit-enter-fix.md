---
'@timlassiter11/yatl': patch
---

Fixed Enter committing an edit even with `commitStrategy: 'batch'`, unlike Tab and clicking away, which already correctly leave the edit pending. Enter now blurs and closes the cell as before, but no longer dispatches a commit in batch mode - the edit stays pending until something explicitly commits it.
