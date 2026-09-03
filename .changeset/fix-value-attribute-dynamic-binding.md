---
'@timlassiter11/yatl-ui': patch
---

Fixed `yatl-input`, `yatl-textarea`, and `yatl-radio-group` silently ignoring the `value` attribute when it was set through a dynamic binding in a template (e.g. Lit's `value=${someValue}`) rather than as a static string. A custom element already registered via `customElements.define()` upgrades - constructor and all - synchronously as part of the `cloneNode`/`importNode` a templating library uses to stamp out its template content, which happens *before* the template engine commits any bound attribute values onto that clone. `value` used to seed itself from the raw `value` attribute directly in a field initializer to work around an unrelated Lit first-render timing quirk, but that read always ran too early to see an attribute supplied this way, silently falling back to empty. `value` is now seeded from `defaultValue` in `willUpdate()` instead, once Lit's own (reliable) attribute-to-property sync has had a chance to run.
