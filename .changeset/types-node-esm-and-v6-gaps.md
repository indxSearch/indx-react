---
"@indxsearch/indx-types": minor
---

Loads in plain Node, Vitest and anything else that resolves by the ESM rules: the build now imports its own files with their extensions, so the enums (`SearchMode`, `Tolerance`, `SystemState` …) work at runtime, not only under a bundler. And the rest of the 6.0 server's search is typed: `offset`, `facetFields`, `facetValueLimit` and `includeDocuments` on `QueryProxy`; `documents` (typed with a generic, `Result<Book>`), `facetStats` and `cold` on `Result`; `MultiSearchAnswer` for `search/multi`; and cold storage's `ColdWrite`, `ColdBatchItem`, `ColdBatchOutcome` and `ColdView`.
