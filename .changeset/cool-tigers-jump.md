---
'@timlassiter11/yatl-ui': patch
---

Fixed a dropdown-based control (yatl-select, yatl-date-input, yatl-date-range-input) closing and immediately reopening on a second label click instead of toggling closed, caused by two separate issues: the label's press was being read as an outside click by the dropdown's click-away-to-close handler, and its forwarded click was being ignored by a guard meant for keyboard-generated clicks.
