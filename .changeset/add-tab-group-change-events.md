---
"@timlassiter11/yatl-ui": minor
---

`yatl-tab-group` now fires a cancelable `yatl-tab-change-request` before switching tabs, and `yatl-tab-change` after - both carry the target panel name. `setActiveTab()` also now returns whether a matching panel was found and activated.

Fixed along the way: clicking a disabled tab no longer switches its panel, clicking the already-active tab no longer fires change events, and calling `setActiveTab()` with an unknown name no longer blanks out the currently active tab/panel before discovering there's nothing to switch to.
