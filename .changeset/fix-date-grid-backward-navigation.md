---
"@timlassiter11/yatl-ui": patch
---

Fixed `yatl-date-grid` not navigating to the previous month when a leading day from that month (shown at the start of the grid) was clicked - it only auto-navigated forward for trailing next-month days, leaving the displayed month unchanged (and visually inconsistent with the just-selected date) when going backward.
