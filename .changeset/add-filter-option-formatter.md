---
"@timlassiter11/yatl": patch
---

getColumnFilterValues() no longer passes flattened array elements to valueFormatter (which formats the whole cell value, not one element) - added an array-safe filterOptionFormatter column option for formatting individual flattened option labels
