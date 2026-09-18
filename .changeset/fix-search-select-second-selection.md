---
'@timlassiter11/yatl-ui': patch
---

Fixed `yatl-search-select` making it impossible to select a second option: clicking a non-focusable option (or a selected chip's trash icon) blurs the search input with nowhere else in the component to receive focus, and a `focusout` listener on that input used to react by collapsing straight back to the "selected chips" summary view - hiding the very option the in-flight click was headed for. The component already has a document-level `pointerdown` listener that's the real authority on whether focus left the component; the redundant, and actively wrong, `focusout` handler is removed.
