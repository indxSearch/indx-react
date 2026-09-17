---
"@indxsearch/intrface": patch
---

`RangeFilterPanel` inputs no longer change width on decimal fields. The Min input's `max` attribute was `sliderValue - 1` with floating-point noise (`7.712999999999999` on a rating of 8.713), and the browser sizes a number input to the longest value its bounds admit, so Min came out three times wider than Max until the first drag. Bounds now go out rounded to the field's precision and one step apart instead of one unit, and both inputs carry an explicit width from the field's bounds, so the browser's guess never applies and a typed value is never clipped either.
