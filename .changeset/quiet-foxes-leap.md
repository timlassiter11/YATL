---
'@timlassiter11/yatl-ui': patch
---

Fixed clicking a yatl-select's label not opening the dropdown when multi is set, since the decorative display input carrying the label's target id doesn't render in multi mode. Moved the id onto the actual trigger element instead, which is present in both modes.
