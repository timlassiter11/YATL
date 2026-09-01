---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-dialog` getting stuck open (or closed) when `show()`/`hide()`/`open` was toggled again while the previous open/close transition was still in flight - the in-progress-transition guard silently no-op'd instead of applying the newer request once the transition finished, leaving `open` desynced from whether the dialog was actually visible.
