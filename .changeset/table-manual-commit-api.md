---
'@timlassiter11/yatl': minor
---

Added a public commit API for building a manual "Save"/"Discard" control (e.g. for `commitStrategy: 'batch'`, where nothing otherwise triggers a commit):

- `requestCommit(): boolean` bundles every currently pending edit into one transaction and fires `yatl-table-commit-request` for it - the same event Enter/Tab/clicking away already dispatch depending on `commitStrategy`. Returns `false` if there was nothing pending.
- `discardPendingChanges()` reverts every pending edit back to its last-committed value.
- `hasPendingChanges` reports whether any cell has an uncommitted edit.
- A new `yatl-table-pending-change` event fires whenever the set of pending edits changes (a field becoming dirty/clean, or a transaction being rejected back into a pending state), so a Save/Discard control can enable itself reactively instead of polling.

Previously, doing any of this required reaching into `table.controller` and replicating the table's own internal commit-dispatch logic by hand.
