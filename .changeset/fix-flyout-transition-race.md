---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-flyout` getting stuck open (or closed) when `show()`/`hide()`/`open` was toggled again while the previous open/close transition was still in flight - same issue as `yatl-dialog`, since the two share the same show/hide logic.
