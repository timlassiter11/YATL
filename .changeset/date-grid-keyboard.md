---
'@timlassiter11/yatl-ui': minor
---

`yatl-date-grid` (and so the date pickers and date inputs) can be used from the keyboard and can jump to a month or year.

- Only one day is in the tab order. Arrow keys move a day or a week (into the next or previous month), Home and End go to the start and end of the week, Page Up and Page Down change the month (with Shift, the year), and Enter or Space picks the day. Focus stays within `min` and `max`.
- Clicking the month title shows the months of that year, and clicking the year shows a page of years. The arrows page by year or by 12 years there, and Escape goes back to the days. Months and years outside `min` and `max` are disabled.
- Days have full date labels for screen readers, today is marked `aria-current="date"`, and selected days are marked selected.
- `focusCalendar()` on the grid, `yatl-date-picker` and `yatl-date-range-picker` puts focus on the selected (or today's) day. The date inputs call it when their calendar opens.
