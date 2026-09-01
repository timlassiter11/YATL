---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-dropdown` losing its outside-click/Escape/positioning listeners if it was disconnected and reconnected while open (e.g. a parent moved it to a new location in the DOM) - it would keep rendering as open but stop responding to anything until manually toggled.
