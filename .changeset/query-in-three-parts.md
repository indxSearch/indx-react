---
"@indxsearch/indx-types": major
"@indxsearch/intrface": major
---

The 6.0 wire: a query in three parts. `QueryProxy` takes `mode` (`SearchMode`: `EditDistance`,
the default, or `Bm25f`; whether the records are reranked by Coverage is `ranking.rerank`, on by
default) and three parts, `match` (`MatchSetup`: tolerance, rungs, the word being
typed), `candidates` (`CandidateSetup`: `candidatesPerRow`, `maxCandidates`, `fallback`, `rest`) and
`ranking` (`RankingProxy`: the blend, field weights and boosts, `boosts` and `buries`).
`enableCoverage`, `coverageDepth`, `coverageSetup` and the `CoverageSetup` and `CloudQuery` types are
gone. Enums are strings, by name, as the server now sends and reads them (`BoostStrength.Med`, was
`Medium`). `Result` loses `truncationIndex` and `truncationScore` and has `toleranceCounts`,
`countedTolerance`, `overflow`, `isFallback`, `reason` and `systemState` (`toleranceCounts.rest`
with `candidates.rest`). `FieldProxy` follows the
server's: `wordMatching` in place of `searchable`, and `tolerance` (`Exact`, `OneEdit`,
`TwoEdits`) in place of `coverageStrictness`, whose `None` is a `coverageWeight` of 0; the
`CoverageStrictness` enum is gone.

The settings panel shows the mode and a rerank switch. The intrface provider takes `mode`, `match`, `candidates` and `ranking` in place of
`enableCoverage`, `coverageDepth` (now `candidates.maxCandidates`) and `initialCoverageSetup`;
`SearchSettings` holds the same, and `setSearchSettings` merges a part member by member. The state's
`truncationIndex` is `countedTotal`, the records the search counted, with `isFallback` beside it.
Needs a 6.0 server.
