---
"@indxsearch/intrface": major
---

`removeDuplicates` is gone from `SearchProvider` and the search settings, and searches no longer send it: the server never acted on it. To show one row per title or per work, use the server's `collapseBy`.
