---
"@indxsearch/intrface": patch
---

RangeFilterPanel: a histogram bar now ends at its last value instead of at the next bucket's first, so after clicking a bar its right edge sits under the max thumb and at the end of the track's highlight. Before, it ran one step past both. The step between buckets, which holds no values, is left empty with the separator in it.
