---
"@timlassiter11/yatl-ui": major
---

`yatl-confirmation-dialog` now exposes most of the underlying `yatl-dialog` feature set instead of hiding it behind a fixed accept/reject shape:

- Added `fullscreen` (passes through to the inner dialog).
- Added a third "cancel" outcome, separate from "reject", for choices like Save / Don't Save / Cancel - use the new `cancelText`/`cancelColor`/`cancelVariant` properties and the new `cancel()` method and `confirmWithCancel(): Promise<'accept' | 'reject' | 'cancel'>` method. `confirm(): Promise<boolean>` keeps its existing signature; it now resolves `false` for both reject and cancel.
- Added `acceptColor`/`rejectColor`/`cancelColor` and `acceptVariant`/`rejectVariant`/`cancelVariant`, plus `accept-button`/`reject-button`/`cancel-button` CSS parts, so a destructive action can actually be styled as destructive.
- Added `header`, `header-actions`, and `footer` slot passthrough (alongside the existing `footer-actions`), and exported the inner dialog's `header`/`footer`/`close-button` parts.
- Added `yatl-confirmation-dialog-show`/`-hide` events that mirror the inner dialog's own show/hide lifecycle, and a new `yatl-confirmation-dialog-cancel` event.
- Fixed a bug where the dialog's title never actually rendered through the new header slot passthrough (an empty forwarded `<slot>` was suppressing the inner dialog's own title fallback).
- Fixed a bug where opening the dialog by setting the `open` property/attribute directly (bypassing `show()`) left the `open` attribute stuck after the dialog was closed via a button - `open` is now a reflecting property, consistent with `yatl-dialog`.

**Breaking changes**, made deliberately since this component has a single internal consumer today:

- Dismissing the dialog without an explicit choice - Escape, a backdrop click, or the close button - now fires `yatl-confirmation-dialog-cancel` instead of `yatl-confirmation-dialog-reject`.
- `modal` now defaults to `true` (was implicitly `false`, inherited from the wrapped `yatl-dialog`). A confirmation dialog is guarding a decision, so accidental backdrop/Escape dismissal is now off by default; the close button remains the deliberate way to cancel without an explicit choice.
