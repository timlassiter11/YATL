---
"@timlassiter11/yatl": patch
---

Fixed deleteRowAtIndex deleting the wrong rows when passed multiple indices, since removing an earlier index shifted the positions of later ones before they were processed
