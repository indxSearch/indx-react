---
"@indxsearch/intrface": patch
---

`<ValueFilterPanel match="any" />` now works on scalar fields. Facet counts came from the filtered search, which included the field's own selection, so on a field where every document holds one value ticking "red" left only red in the panel and the second value could never be picked. Each `any` field with a selection now gets a facets-only search whose filter leaves that field out, sent in parallel with the main search, and the panel reads that field's counts from it. Fields with nothing selected, and `match="all"` fields, send nothing extra.
