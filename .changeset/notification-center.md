---
'@timlassiter11/yatl-ui': minor
---

Added `yatl-notification-center`, a bell trigger with an unread-count badge and a dropdown of the current session's toast history. It's purely additive - drop it in anywhere and it starts working with zero other wiring, whether or not `yatl-toast-manager` is also mounted. Both are now backed by a shared, session-only toast store instead of `yatl-toast-manager` owning the state itself, so a toast dismissed or expired from the live overlay stays in `yatl-notification-center`'s history until it's cleared, and clearing a toast from the history (or via "Clear all") also removes it from the live overlay if it's still showing.

Read state follows how a toast left the live overlay: closing one manually (the close button, or a consumer calling `toastEl.hide()`) marks it read, but its duration timer expiring on its own leaves it unread - the user may not have been looking, so the badge stays as their cue they missed it. `<yatl-toast>`'s `yatl-toast-hide` event now carries this as `event.reason` ('user' | 'timeout'), and `hide()` takes an optional matching argument (defaults to 'user').

While `yatl-notification-center`'s panel is open, each entry's relative timestamp ("2 minutes ago") keeps advancing on its own via an interval, instead of only updating when a new toast triggers a re-render. The interval stops as soon as the panel closes.

Each entry's icon is now colored to match its toast's variant (danger red, success green, ...), and always renders - even a neutral toast with no icon glyph still reserves the icon's space, so entry titles stay aligned regardless of variant. `<yatl-toast>`'s own status icon got the same treatment for consistency between a live toast and its later history entry.

Also, on `YatlToastData`:

- Added `id`. Supplying the id of an existing toast via `toast({ id, ... })` updates it in place (and restarts its duration timer if it's still showing) instead of stacking a new one - useful for progress toasts. `toast()` now returns the id it used, generating one when omitted.
- Added `persist`. Set to `false` to keep a toast out of `yatl-notification-center`'s history once it's dismissed, for low-value toasts that shouldn't clutter it.
