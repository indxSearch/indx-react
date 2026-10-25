---
"@indxsearch/intrface": patch
---

Every search carries `locale`, the page's language for the statistics: `SearchProvider`'s `locale` prop, else the document's `lang`, else the browser's. The dataset's Statistics overview shows which languages people search in. Nothing about where they are is sent.
