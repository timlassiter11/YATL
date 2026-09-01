---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-table-view`'s sidebar (`sidebar-start`/`sidebar-end` slots) showing a second, nested scrollbar on slotted content like `yatl-card` when the window got short enough that the sidebar itself needed to scroll. `yatl-card` defaults to `height: 100%`, which inside the sidebar's scrollable flex column meant "100% of the sidebar" rather than "however tall my own content is" - squeezing the card into less space than it needed and forcing it to scroll internally on top of the sidebar's own scrollbar. Sidebar-slotted content now sizes to its natural content height, so only the sidebar scrolls.
