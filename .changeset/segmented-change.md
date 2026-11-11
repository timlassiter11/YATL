---
'@timlassiter11/yatl-ui': patch
---

A typed date, date range or time now always fires `change` when focus leaves the control. Leaving through the calendar or clock button used to skip it, so `yatl-date-range-filter` and `yatl-date-filter` didn't apply a typed value until it was picked from the calendar. Enter also fires `change` for a typed value now, like a native input.
