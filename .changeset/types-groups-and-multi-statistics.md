---
"@indxsearch/indx-types": minor
---

Types for one search per keystroke: `GroupedSearchRequest`, `SearchGroup` and `GroupedSearchResult` for `search/groups` (one text answered in named sections, each with its own filter, rows and count), `MultiSearchQuery` for a `search/multi` search that says for itself whether it counts in the statistics, and `includeFields` on `QueryProxy` to get only the record fields a page shows. Also on `QueryProxy`: `collapseBy` (one record per value of a field, such as one row per title), `counts` (named counts in the same search, read from the result's `counts`), and `facetSelections` and `facetRanges` (facets that leave out their own selection, for OR within a facet group). `removeDuplicates` is gone: the server never acted on it.
