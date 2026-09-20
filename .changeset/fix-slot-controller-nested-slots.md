---
'@timlassiter11/yatl-ui': patch
---

Fixed `HasSlotController` (used internally by `yatl-toast`, `yatl-card`, `yatl-dropzone`, `yatl-tree-item`, and all form controls) misreporting slot content in three cases:

- A default slot whose content is a bare text node with no wrapping element (e.g. `<yatl-toast>Something went wrong</yatl-toast>`) was reported as empty - `querySelector`, which the check relied on, can only ever match elements.
- A forwarded/nested slot - a wrapper component re-projecting its own consumer's content into an inner component's slot, e.g. `yatl-dialog` wrapping `yatl-card` via `<slot name="footer" slot="footer-start"></slot>` - was reported as having content merely because the forwarding `<slot>` element always exists as a light-DOM child, regardless of whether anything was actually assigned to (or fell back into) it. In practice this meant an empty `yatl-dialog` (or `yatl-confirmation-dialog`) footer/header still got styled as if it had content.
- A forwarded/nested slot that resolves to bare text (either its own fallback content, or something assigned through it by the real outer consumer) was reported as empty, same root cause as the first case one level deeper - resolving through a forwarding `<slot>` used `assignedElements()`/`.children`, which are element-only just like `querySelector`.
