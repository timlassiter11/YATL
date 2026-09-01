---
"@timlassiter11/yatl": patch
---

Sort values are now computed lazily, only for columns actually being sorted by, instead of eagerly for every column on every data or column change - significantly reducing the cost of loading or reloading large datasets, especially with many columns
