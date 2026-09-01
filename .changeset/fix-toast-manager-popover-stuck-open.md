---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-toast-manager`'s popover staying open (in the top layer, even with zero visible toasts) after the last toast was dismissed - `handleToastHide` removed the toast from the list but never re-evaluated whether the popover should still be open, unlike the request path which does.
