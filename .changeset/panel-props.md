---
"@indxsearch/intrface": minor
---

One vocabulary for how the filter panels look. `control` replaces `displayType` on every panel and names the control each option renders as: `ValueFilterPanel` `checkbox | radio | button | toggle`, `BucketFilterPanel` `checkbox | radio | button`, `RangeFilterPanel` `slider | input`, `SortByPanel` `select | radio`. `displayType` still works as a deprecated alias (`'dropdown'` maps to `'select'`).

`radio` on the value and bucket panels is single-select: a click replaces the selection, and the field's other options keep their counts so the user can switch. `BucketFilterPanel` now hides buckets that hold no values, as the server hides zero-count facet values; `showEmpty` (replacing 3.4.0's `hideEmpty`) keeps them, disabled, for a fixed set of named buckets. It also gains `limit`, and `showActivePanel` now does something: it tints the panel while it holds a selection, on the value, bucket and range panels. `toggleFilter` and `toggleBucketFilter` take an optional `exclusive` flag for callers building their own single-select controls.
