---
'@timlassiter11/yatl': patch
'@timlassiter11/yatl-ui': patch
---

Work on pages served over plain HTTP. `toast()`, the toast store and the table controller's `createCommitTransaction()` used `crypto.randomUUID()`, which browsers only provide in secure contexts (HTTPS or localhost), so they threw `crypto.randomUUID is not a function` elsewhere. They now fall back to `crypto.getRandomValues()`, which is available everywhere.
