---
"@timlassiter11/yatl-ui": patch
---

Fixed a race condition where a `change`/`input` event dispatched by a form control (`yatl-input`, `yatl-textarea`, `yatl-number-input`, `yatl-select`, `yatl-search-select`, `yatl-typeahead`, `yatl-date-input`, `yatl-date-range-input`) could reach a listener - most commonly an enclosing `<form>`'s own `change` handler reading `FormData` - before the new value had been committed to `ElementInternals`. The commit used to happen in Lit's `updated()` lifecycle, one microtask after the event was dispatched, so a synchronous listener would see the *previous* value (or nothing, on the first interaction). The value is now committed synchronously before the event fires. (`yatl-checkbox`/`yatl-switch`/`yatl-radio` were already unaffected - they commit synchronously through their own `checked`/`value` setters.)
