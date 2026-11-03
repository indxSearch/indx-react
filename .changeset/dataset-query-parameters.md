---
"@indxsearch/intrface": major
---

A page sends only what it sets, so a dataset's query parameters decide the rest (6.0). The provider's
`mode` is left out unless the page sets it (the dataset's mode, else EditDistance), and
`setSearchSettings({ match: undefined })` (or `candidates`, `ranking`) hands a whole part back to the
dataset. The settings panel shows the dataset's values where the page sets none, from
`query-parameters`' `effective`. While the offer to ask is strong, the page's searches take
`STRICT_MATCH` (`tolerance: Exact`, `typingPrefixFrom: 0`, `joinedWords: false`; was
`STRICT_COVERAGE`), and `visibleResults` takes the count of records counted where it took the
truncation index.
