---
"@indxsearch/intrface": minor
---

`convertResult(documentKey, type, { quantity?, queryId? })` on the search context reports a conversion, such as an order or an add to cart, to the dataset's statistics. It is credited to the search the document was chosen from, even after the visitor has searched again. It never throws.
