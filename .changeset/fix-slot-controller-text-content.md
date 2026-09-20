---
'@timlassiter11/yatl-ui': patch
---

Fixed `HasSlotController` (used internally by `yatl-toast`, `yatl-card`, `yatl-dropzone`, `yatl-tree-item`, and all form controls) not detecting default-slotted content when it's a bare text node with no wrapping element - e.g. `<yatl-toast>Something went wrong</yatl-toast>`. `querySelector`, which the default-slot check relied on, can only ever match elements, so it silently missed plain text. Components that fall back to a property-driven default when nothing is slotted (like `yatl-toast`'s `message`) would incorrectly ignore default-slotted plain text and show nothing.
