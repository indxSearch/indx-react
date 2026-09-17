---
"@indxsearch/intrface": minor
---

`RangeFilterPanel` histogram bars are clickable. A click moves both slider thumbs onto that bar's bucket and applies it as the range filter; clicking the selected bucket again returns to the full range. Each bar is a button spanning the histogram's full height, so a one-pixel bar is as easy to hit as a tall one, with a hover tone, keyboard focus and an accessible label carrying the bucket's range and count.

The histogram's highlight also follows the thumbs exactly now. It used to light whole buckets, so with a coarse histogram the lit region overshot the selection by up to a bucket; the bars are now drawn muted with a lit copy clipped to the selected span, so a bucket the thumb sits in is lit up to the thumb and no further.
