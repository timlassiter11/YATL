---
"@timlassiter11/yatl-ui": patch
---

Fixed `getAnimationPromise`'s fallback timeout never actually resolving - an inverted condition caused it to bail out instead of resolving when no matching `animationend`/`animationcancel` event ever fired, so anything waiting on it (`yatl-dialog`, `yatl-flyout`, `yatl-toast`) could hang indefinitely instead of falling back after the timeout as intended.
