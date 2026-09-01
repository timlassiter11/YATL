---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-checkbox`/`yatl-switch`/`yatl-radio` silently ignoring an explicit `.checked` property set before the element's first render (e.g. a `.checked=${...}` binding from a parent template) - `firstUpdated()` unconditionally re-seeded `checked` from `defaultChecked` afterward, clobbering it back to the attribute-driven default.
