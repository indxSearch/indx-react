---
'@indxsearch/intrface': minor
---

Your search page now feeds the dataset's Statistics tab. Every search carries a session id for the page load, so the server counts the search a visitor settled on rather than every keystroke. And a result can report that it was chosen: the `SearchResults` render function gets a second argument with `select()`, and the context has `selectResult(result)`. Call it from the click that opens a result, and click-through and click position show up in Statistics. Each result now also carries its `position` in the list. Nothing to configure, and a page that never calls `select()` works as before.
