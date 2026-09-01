---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-dropdown` keyboard navigation (Arrow Up/Down, Home, End) landing focus on disabled options - selecting them was already blocked, but they were reachable and counted toward wrap-around, which is inconsistent with standard listbox/menu keyboard conventions.
