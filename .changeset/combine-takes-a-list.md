---
"@indxsearch/indx-types": major
"@indxsearch/intrface": minor
---

`filters/combine` takes a list. `CombinedFilterProxy` is `{ filters: FilterProxy[], useAndOperation }`
in place of `{ a, b, useAndOperation }`, and the server makes one filter of the whole list. The
intrface sends one combine per field and one for the whole selection, where it sent one per pair:
three values on one field were two requests and are one. Needs a server with the list form.
