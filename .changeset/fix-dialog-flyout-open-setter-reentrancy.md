---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-dialog` and `yatl-flyout` dispatching `-show`/`-hide` events twice for a single `show()`/close: their `open` property setter called `show()`/`hide()` on any change, but `show()`/`hide()` themselves set `open` as part of their own internal state transition, re-entering the setter and kicking off a second, independent show/hide run. A re-entrancy guard now prevents that internal assignment from triggering a second call.
