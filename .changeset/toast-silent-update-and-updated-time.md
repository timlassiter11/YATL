---
'@timlassiter11/yatl-ui': minor
---

Added `silent` to `YatlToastData`, `'always' | 'onUpdate'`:

- `silent: 'always'` updates an existing toast's content without bringing it back to the live overlay if the user already dismissed it - useful for e.g. a background retry updating the same error notification without repeatedly popping back up. A brand-new toast raised this way is created already dismissed, so it never shows live at all, even the first time.
- `silent: 'onUpdate'` shows live normally the first time (there's nothing to update yet), but behaves like `'always'` on every subsequent call that finds an existing record for the same `id`. This is for callers that can't tell whether a given call is the first attempt or a repeat - the store already knows, from whether `id` matches an existing record, so the caller can just always pass `silent: 'onUpdate'` and get the right behavior either way.

Either way, a silent call still marks the entry unread and bumps it to the front of history, so the notification center still reflects it - "silent" only means it doesn't interrupt with a popup, not that it's hidden entirely.

Also, `yatl-notification-center` now displays each entry's most recent update time instead of when it was first created - unchanged for a toast that's never been updated (`updatedAt` starts equal to `createdAt`), but a recurring notification (via `id`-based upserts, silent or not) now reads as "how long since this last happened" instead of "how long since it first happened".
