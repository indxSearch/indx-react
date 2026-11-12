# Changelog

## 4.0.0-beta.2

### Minor Changes

- Types for one search per keystroke: `GroupedSearchRequest`, `SearchGroup` and `GroupedSearchResult` for `search/groups` (one text answered in named sections, each with its own filter, rows and count), `MultiSearchQuery` for a `search/multi` search that says for itself whether it counts in the statistics, and `documentFields` on `QueryProxy` to get only the record fields a page shows.

## 4.0.0-beta.1

### Minor Changes

- Loads in plain Node, Vitest and anything else that resolves by the ESM rules: the build now imports its own files with their extensions, so the enums (`SearchMode`, `Tolerance`, `SystemState` …) work at runtime, not only under a bundler. And the rest of the 6.0 server's search is typed: `offset`, `facetFields`, `facetValueLimit` and `includeDocuments` on `QueryProxy`; `documents` (typed with a generic, `Result<Book>`), `facetStats` and `cold` on `Result`; `MultiSearchAnswer` for `search/multi`; and cold storage's `ColdWrite`, `ColdBatchItem`, `ColdBatchOutcome` and `ColdView`.

## 4.0.0-beta.0

### Major Changes

- 0b3925e: `filters/combine` takes a list. `CombinedFilterProxy` is `{ filters: FilterProxy[], useAndOperation }`
  in place of `{ a, b, useAndOperation }`, and the server makes one filter of the whole list. The
  intrface sends one combine per field and one for the whole selection, where it sent one per pair:
  three values on one field were two requests and are one. Needs a server with the list form.
- a394c82: The 6.0 wire: a query in three parts. `QueryProxy` takes `mode` (`SearchMode`: `EditDistance`,
  the default, or `Bm25f`; whether the records are reranked by Coverage is `ranking.rerank`, on by
  default) and three parts, `match` (`MatchSetup`: tolerance, rungs, the word being
  typed), `candidates` (`CandidateSetup`: `candidatesPerRow`, `maxCandidates`, `fallback`, `rest`) and
  `ranking` (`RankingProxy`: the blend, field weights and boosts, `boosts` and `buries`).
  `enableCoverage`, `coverageDepth`, `coverageSetup` and the `CoverageSetup` and `CloudQuery` types are
  gone. Enums are strings, by name, as the server now sends and reads them (`BoostStrength.Med`, was
  `Medium`). `Result` loses `truncationIndex` and `truncationScore` and has `toleranceCounts`,
  `countedTolerance`, `count`, `ranked`, `isFallback`, `reason` and `systemState` (`toleranceCounts.rest`
  with `candidates.rest`). The provider's `countedTotal` is the result's `count`. `FieldProxy` follows the
  server's: `wordMatching` in place of `searchable`, and `tolerance` (`Exact`, `OneEdit`,
  `TwoEdits`) in place of `coverageStrictness`, whose `None` is a `rerankWeight` of 0; the
  `CoverageStrictness` enum is gone. Coverage is called reranking: `enableMatchReport`,
  `matchReport` (`MatchReport`) and a field's `rerankWeight` in place of `enableCoverageReport`,
  `coverageReport` and `coverageWeight`.

  The settings panel shows the mode and a rerank switch. The intrface provider takes `mode`, `match`, `candidates` and `ranking` in place of
  `enableCoverage`, `coverageDepth` (now `candidates.maxCandidates`) and `initialCoverageSetup`;
  `SearchSettings` holds the same, and `setSearchSettings` merges a part member by member. The state's
  `truncationIndex` is `countedTotal`, the records the search counted, with `isFallback` beside it.
  Needs a 6.0 server.

- 496a2dc: The rest of the 6.0 server's requests and answers: `InFilterProxy`, `PositionFilterProxy`,
  `FilterExpressionProxy` with `FilterExpressionResultProxy` and `FilterExpressionErrorDetail`, the
  saved `BoostRule` and `BuryRule` (`RuleCondition`), a dataset's `DatasetQueryParameters` and
  `QueryParametersResponse`, and field profiles (`FieldProfile`, `FieldProfileView`,
  `FieldProfilesResponse`, `FieldProfilesRequest`). `FieldProxy.typingPrefixFrom` and
  `ValueFilterProxy.isCaseSensitive` are added; `SystemStatus` has `indexedTextTruncated`,
  `wordTokenSizeCapped` and `fieldK1Ignored`, and loses `tooLongClientText` and
  `unknownConfigurationError`, which the server no longer sends. `IndxProblemCode` names every code
  the server answers with, `invalidFilterExpression` among them, and `IndxProblem.errors` carries an
  expression's errors. `PageFill`, `MatchReport`, `RecordMatch`, `QueryWordMatch` and `WordMatch` are
  exported. Every type is checked against the server's OpenAPI document.

### Minor Changes

- 9085f78: `QueryProxy.measureFit` and `QueryFitResult`: a search can also say how well its results explain the
  text (`explainedShare`, `unexplainedShare`, `explainedWords`, `unexplainedWords`), for telling a
  search from a question.

## 3.1.0

### Minor Changes

- `SystemStatus` describes a rebuild's outcome: `shadowBuildFinishedUtc` says when the last rebuild ended, and `shadowBuildError` why it failed, if it did. A failed rebuild changes nothing: the dataset keeps serving what it had.

All notable changes to this project will be documented in this file.

## 3.0.0

### Major Changes

- 257de84: `SystemState.Hibernated` (-1) is removed, matching the server: hibernation is no longer a state
  of its own. A hibernated dataset reports `Created` and its status carries `recordsOnDisk > 0`
  (new field, with `fieldsDiscovered` beside it); the library's `Hibernate()` lands in `Loaded`.
  Code switching on `Hibernated` or comparing `systemState === -1` should derive it instead:
  `state === SystemState.Created && recordsOnDisk > 0`.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-09-14

### Added

- `rateLimited` in `IndxProblemCode`, with `retryAfterSeconds` on `IndxProblem`: the
  server's anonymous auth endpoints (login, register, password reset) answer 429 with it
  after too many attempts from one address; so do API calls over a key's per-second budget
  (where the operator enabled it), heavy operations beyond the server's concurrency cap, and
  searches beyond its queue.

## [2.3.0] - 2026-09-12

### Changed

- `CloudQuery` is renamed `QueryProxy`, matching the server (`Indx.Http.QueryProxy`)
  and its siblings `VectorQueryProxy` / `HybridQueryProxy`. `CloudQuery` stays as a
  deprecated alias until 3.0. The JSON on the wire is unchanged.

## [2.2.0] - 2026-09-11

### Added

- `IndxProblem` and `IndxProblemCode`: the RFC 9457 problem document every
  error response carries, with its `code` extension typed as a union of the
  documented codes (`unknownFilter`, `invalidState`, `shadowBusy`,
  `datasetNotFound`, …) and the `invalidState` extras (`currentState`,
  `allowedStates`, `retryable`, `errorMessage`). Switch on `code`, not on the
  HTTP status. `unknownFilter` is new on the server: a filter token it cannot
  honour is a 400 now, never a silently unfiltered search.

## [2.1.0] - 2026-09-08

### Added

- `SynonymList`, `SynonymEntry`, and the `SynonymDirection` enum, typing the
  `GET`/`PUT …/synonyms` endpoints. `direction` is numeric on the wire
  (0 = Multidirectional, 1 = OneWay), like every enum in this API.

## [2.0.0] - 2026-08-25

First stable release of the v2 line, targeting IndxCloudApi v2 (IndxSearchLib v5).
(Consolidates the unpublished 2026-05-12 draft and the `2.0.0-alpha.20260617`
pre-release that shipped under the `next` tag.)

### Changed

- **BREAKING**: Type definitions target IndxCloudApi v2 (Indx v5).
- `DataSetListDto` reflects the team model (`name`, `teamName`, `role`).

### Added

- `LicenseInfo.licenseFileFound` and `ProcessError.timeStampUtc`, matching the
  IndxCloudApi v2 OpenAPI schema exactly (verified field-by-field).

### Compatibility

- Requires IndxCloudApi v2
- Zero runtime dependencies (types-only package)

---

## [1.0.0] - 2026-01-21

### Added

- Initial release of `@indxsearch/indx-types`
- Complete TypeScript type definitions for IndxCloudApi v1.0.2
- `CoverageSetup` interface with all current properties
- `CloudQuery` interface for search requests
- `Result` and `ScoreEntry` interfaces for search responses
- `FilterProxy`, `RangeFilterProxy`, `ValueFilterProxy`, `CombinedFilterProxy` for filtering
- `BoostProxy` interface for search result boosting
- `SystemStatus` and `LicenseInfo` interfaces for system health
- `LoginInfo` interface for authentication
- `SystemState` enum (Hibernated, Created, Loading, Loaded, Indexing, Ready, Error)
- `BoostStrength` enum (Low, Medium, High)
- `StringInt32KeyValuePair` utility type
- Zero runtime dependencies (types-only package)
- Full ESM and CommonJS support
- Comprehensive README with usage examples
- Apache 2.0 license

### Technical Details

- Based on official Swagger specification from https://cloud.indx.co/swagger/v1/swagger.json
- All properties correctly typed with optional modifiers matching API spec
- `documentKey` correctly typed as `number` (Int32)
- `truncationScore` default value: 255 (byte)
- `systemState` properly uses `SystemState` enum
