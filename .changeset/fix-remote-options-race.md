---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-remote-options` race conditions: a slower fetch for a previous `uri` could overwrite options loaded for a newer `uri` if it resolved later, a failed fetch could delete the wrong `uri`'s cache entry if `uri` had changed again while the request was in flight, and a fetch failure was an unhandled promise rejection since `fetchOptions()` is called fire-and-forget.
