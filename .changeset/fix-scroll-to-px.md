---
"@timlassiter11/yatl": patch
---

scrollToPx() now actually scrolls the table - it was setting scrollTop on the outer .table element (overflow: hidden, never scrolls) or the lit-virtualizer host (only a scroll container when its scroller property is set, which we don't do) instead of .scroller, the element that actually scrolls
