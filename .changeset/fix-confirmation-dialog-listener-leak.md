---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-confirmation-dialog`'s `confirm()` leaving a dangling accept or reject listener attached forever after each call (only the direction that actually fired was cleaned up by `once`) - both are now removed together once either resolves.
