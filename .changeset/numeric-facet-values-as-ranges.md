---
'@indxsearch/intrface': minor
---

A selected value on a numeric field is sent as a range filter with equal limits instead of a value filter. A value filter compares text, so on a number it was slow and missed `129.0` when asked for `129`; a range with equal limits is numeric equality through the field's index. The field types come from `GET fields/configuration`, fetched once at start beside the three field lists, and are exposed as `fieldTypes` on the search state. Against an older server that still answers 403 to a Search key on that call, nothing changes: every selection stays a value filter.
