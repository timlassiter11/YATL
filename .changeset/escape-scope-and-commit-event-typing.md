---
'@timlassiter11/yatl': patch
---

Fixed Escape while editing a cell discarding every pending edit in the table instead of just the one being edited. Added `revertPendingChange(row, field)` to the controller as the single-field counterpart to `revertPendingChanges()`.

Also added the previously-missing `yatl-table-commit` to the `HTMLElementEventMap` type augmentation (and its `@fires` doc on `yatl-table`), so `addEventListener('yatl-table-commit', ...)` is correctly typed as `YatlTableCommitEvent` instead of a bare `Event`.

`requestCommit()` now warns once to the console if a commit is requested but nothing responds to `yatl-table-commit-request` (matching the existing warn-once pattern for misconfiguration, e.g. duplicate row IDs) - previously the edit just silently reverted to pending with no indication why. The warning, and the updated docs on `requestCommit()`/`yatl-table-commit-request`, also point out `controller.commitChanges()`/`commitAllChanges()` as the escape hatch for consumers who want local-only edits with no backend and no listener at all.
