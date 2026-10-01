---
"@indxsearch/intrface": patch
---

RangeFilterPanel: a `step` that does not divide the field's range no longer breaks the page. Ratings from 5.3 to 8.7 with `step={0.5}` used to crash on load; now the slider works and still reaches the highest value. Histograms on narrow decimal ranges, such as ratings, now get about twenty bars without setting `resolution`, instead of three or four.
