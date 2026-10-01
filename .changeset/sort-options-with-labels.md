---
"@indxsearch/intrface": minor
---

SortByPanel: offer your own sort choices with readable labels. Pass `options`, such as `{ field: 'votes', ascending: false, label: 'Most voted' }`, and the panel shows those choices in that order instead of every sortable field by its field name. `noneLabel` renames the choice that turns sorting off ("Relevance"), or drops it with `null`. Without `options` the panel works as before.
