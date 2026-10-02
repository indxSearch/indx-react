---
'@indxsearch/intrface': minor
---

`SearchProvider` takes two optional props for the dataset's statistics. `source` names the search surface when a dataset has more than one (`source="header"`, `source="app"`): it is sent with every search, and those searches are counted as usual. `count={false}` keeps a page's searches and the results chosen from them out of the statistics — a test page, an internal tool — while they are still stored. Without either, nothing changes.
