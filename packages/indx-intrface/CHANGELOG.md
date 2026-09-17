# Changelog

## 3.6.0

### Minor Changes

- 5ef6a54: `RangeFilterPanel` histogram bars are clickable. A click moves both slider thumbs onto that bar's bucket and applies it as the range filter; clicking the selected bucket again returns to the full range. Each bar is a button spanning the histogram's full height, so a one-pixel bar is as easy to hit as a tall one, with a hover tone, keyboard focus and an accessible label carrying the bucket's range and count.

  The histogram's highlight also follows the thumbs exactly now. It used to light whole buckets, so with a coarse histogram the lit region overshot the selection by up to a bucket; the bars are now drawn muted with a lit copy clipped to the span between the thumbs, so a bucket the thumb sits in is lit up to the thumb and no further. The lit span is the selection only; what is still reachable under other filters stays on the slider track's live overlay, where it was.

### Patch Changes

- 7a83d42: `RangeFilterPanel` inputs no longer change width on decimal fields. The Min input's `max` attribute was `sliderValue - 1` with floating-point noise (`7.712999999999999` on a rating of 8.713), and the browser sizes a number input to the longest value its bounds admit, so Min came out three times wider than Max until the first drag. Bounds now go out rounded to the field's precision and one step apart instead of one unit, and both inputs carry an explicit width from the field's bounds, so the browser's guess never applies and a typed value is never clipped either.

## 3.5.0

### Minor Changes

- b3a896a: One vocabulary for how the filter panels look. `control` replaces `displayType` on every panel and names the control each option renders as: `ValueFilterPanel` `checkbox | radio | button | toggle`, `BucketFilterPanel` `checkbox | radio | button`, `RangeFilterPanel` `slider | input`, `SortByPanel` `select | radio`. `displayType` still works as a deprecated alias (`'dropdown'` maps to `'select'`).

  `radio` on the value and bucket panels is single-select: a click replaces the selection, and the field's other options keep their counts so the user can switch. `BucketFilterPanel` now hides buckets that hold no values, as the server hides zero-count facet values; `showEmpty` (replacing 3.4.0's `hideEmpty`) keeps them, disabled, for a fixed set of named buckets. It also gains `limit`, and `showActivePanel` now does something: it tints the panel while it holds a selection, on the value, bucket and range panels. `toggleFilter` and `toggleBucketFilter` take an optional `exclusive` flag for callers building their own single-select controls.

## 3.4.0

### Minor Changes

- dcbbb78: New `BucketFilterPanel`: groups a numeric field into ranges the user can tick, several at once. Configure it with a bucket `width` (equal-width buckets over the field's range), an array of lower edges, or explicit `buckets` with labels and open ends. Each bucket is a range filter; buckets on one field are ORed and the field gets the same excluded-field facet search as `match="any"`, so the other buckets keep their counts after the first tick. Counts are summed client-side from the facet values, so no server change. `ActiveFiltersPanel` shows one chip per selected bucket, and `SearchState` gains `bucketFilters` with `toggleBucketFilter` / `resetBucketFilter` on the context.

## 3.3.1

### Patch Changes

- b37653f: `<ValueFilterPanel match="any" />` now works on scalar fields. Facet counts came from the filtered search, which included the field's own selection, so on a field where every document holds one value ticking "red" left only red in the panel and the second value could never be picked. Each `any` field with a selection now gets a facets-only search whose filter leaves that field out, sent in parallel with the main search, and the panel reads that field's counts from it. Fields with nothing selected, and `match="all"` fields, send nothing extra.

## 3.3.0

### Minor Changes

- Starting a search no longer sends `PUT …/datasets/{name}`. That is the server's create-or-open endpoint and needs write access, so every front-end had to ship a key that could change data. `SearchProvider` now calls only read endpoints (status, field lists, search, document lookup, filters), and works with a **Search only** API key. Servers without API key access levels are unaffected: the removed call returned 200 without doing anything for an existing dataset.
- README: use a Search only key, limited to the front-end's datasets.

## 3.2.0

### Minor Changes

- Failed requests now throw `IndxApiError` (exported) instead of a bare `Error`. It carries the server's RFC 9457 problem document: `status`, `code` (typed via `IndxProblemCode` from `@indxsearch/indx-types` 2.2.0), `problem`, and for `invalidState` a `retryable` flag with `retryAfterSeconds` from the `Retry-After` header. The `message` keeps the previous `"<label> failed: HTTP <status>"` form, with the server's detail appended when there is one, so existing string matching keeps working. Applies to search, document lookup, filter creation, vector search and hybrid search.
- Context: the server now answers a filter token it cannot honour with 400 `unknownFilter` rather than silently searching unfiltered. The text search path rebuilds its filter on every search and never holds a stale token, so this reaches consumers only through the `filter` option of `useVectorSearch` / `useHybridSearch`, where the token is the caller's own: on `unknownFilter`, re-create the filter and retry.

## 3.1.2

### Patch Changes

- A superseded search response can no longer overwrite range slider bounds or the per-query facet layer. The request-id guard in `performSearch` now runs before any state write, so when an older, slower response lands after a newer one, nothing from it reaches the UI. Previously its results were discarded but its bounds were not, leaving sliders and histograms scaled to an earlier query. No timing or request changes.

## 3.1.1

### Patch Changes

- Restore AND as the default for several selected values on one field. 3.1.0 switched this to OR, which broke narrowing on multi-valued fields (a movie tagged both "horror" and "comedy" must match both ticks). The OR behaviour is now opt-in per panel with `<ValueFilterPanel match="any" />` for scalar fields.

  Also fixes react-range's "`values` property is in conflict with the current `step`, `min`, and `max`" warning: `RangeFilterPanel` derives its slider `step` from the precision of the field's values (new `step` prop to override) and snaps thumbs onto the grid, and the Minimum Score slider in `SearchSettingsPanel` uses step 1. Requires `@indxsearch/systm` ^2.6.1.

  3.1.0 is deprecated on npm because of the OR default; upgrade to 3.1.1.

All notable changes to `@indxsearch/intrface` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 3.1.0

### Minor Changes

- 04afd27: Filter, settings and error-handling fixes across the components.

  - Several selected values on the **same** field are now ORed (a document matches any of them) before the per-field results are ANDed together with the range filters. Previously every value was ANDed, so ticking a second box in one panel returned nothing.
  - A failed `/filters/*` call, search or document lookup now sets `state.error` instead of silently running an unfiltered search or showing an empty result. `SearchResults` renders `authError` / `state.error` in place of the idle placeholder.
  - `ValueFilterPanel` with `displayType="toggle"` stays on and clickable after the filtered response narrows the facet to `{ true }` only (or removes it). The `null → false` merge now applies to boolean toggles only, so `showNull` works on checkbox and button panels and no `false` option is fabricated for non-boolean fields.
  - `RangeFilterPanel` Min/Max inputs keep what you type and commit (clamp/revert) on blur or Enter instead of clamping every keystroke. The panel now reports a field that is not filterable instead of rendering a slider whose filter the server rejects.
  - `SearchSettingsPanel` changes now trigger a new search. A `maxNumberOfRecordsToReturn` set through `setSearchSettings` survives query changes; the "load more" expansion still resets.
  - Filter and sort changes refresh results when `enableFacets={false}`.
  - **Breaking:** `SearchResults` no longer splits string values that start with `[` into arrays. Opt in with the new `parseArrayStrings` prop, which parses only proper JSON or Python-style list literals.
  - `SearchErrorBoundary` documents that it catches render errors only and uses the systm `Button`.

## [3.0.1] - 2026-08-27

### Fixed

- `authError` was missing from the published type declarations (`SearchContextType` and
  `IndxAuthResult`) — the property existed at runtime in 3.0.0 but TypeScript consumers
  could not access it without a compile error. Types only; no runtime change.

---

## [3.0.0] - 2026-08-25

First stable release of the v3 line, for IndxCloudApi v2 (IndxSearchLib v5).
(Supersedes `3.0.0-alpha.20260617`, previously published under the `next` tag.)

### Changed

- **BREAKING**: All dataset operations use the team-scoped IndxCloudApi v2 routes
  (`/api/teams/{team}/datasets/{dataset}/…`). `SearchProvider` takes a required
  `team` prop alongside `dataset`.
- **BREAKING**: Authentication is token-only. The `email`/`password` props and the
  login flow are removed — pass `preAuthenticatedToken` (create a token on the
  IndxCloudApi API-Key page).
- Initialization now probes dataset **status before** opening the session, so a
  mistyped dataset name fails with a clear "not found" error instead of silently
  creating an empty dataset on the server.

### Added

- `authError` on the search context — set when initialization fails (bad token,
  unknown dataset, unreachable server). Previously such failures surfaced only as
  an unhandled promise rejection in the console.

### Compatibility

- Requires IndxCloudApi v2
- `@indxsearch/indx-types` ^2.0.0 · `@indxsearch/systm` ^2.2.0
- React ^19.0.0 · React DOM ^19.0.0

---

## [2.1.1] - 2026-01-21

### Fixed

- **CRITICAL**: Fixed missing TypeScript declaration files (.d.ts) in published package
  - v2.1.0 was published without declaration files, causing TypeScript compilation errors
  - All type definitions are now properly included in the npm package

## [2.1.0] - 2026-01-21

### Added

- Added dependency on `@indxsearch/indx-types` for centralized API type definitions
- Added `RequiredCoverageSetup` type for internal use (all properties guaranteed present)
- Added new CoverageSetup properties: `truncateWordHitLimit`, `truncateWordHitTolerance`, `includePatternMatches`
- Added "Include Pattern Matches" toggle to SearchSettingsPanel

### Fixed

- **BREAKING FIX**: Fixed `SystemStatus.state` → `systemStatus.systemState` to match actual API response
- **BREAKING FIX**: Fixed `SearchResult.documentKey` type from `string` to `number` (Int32) to match API
- Fixed SystemState enum usage with proper numeric comparisons
- Updated CoverageSetup defaults to match IndxCloudApi v1.0.2 specification
- Fixed `truncationScore` default value: 254 → 255

### Changed

- **BREAKING**: Updated CoverageSetup interface to match IndxCloudApi v1.0.2
  - Removed obsolete properties: `coverageMinWordHitsAbs`, `coverageMinWordHitsRelative`, `coverageLcsErrorToleranceRelativeq`, `coverageQLimitForErrorTolerance`
  - These properties no longer exist in the API specification
- Updated SearchSettingsPanel UI to reflect new CoverageSetup parameters
- Removed `truncationScore` input from SearchSettingsPanel UI (still sent to API with default value)
- Now imports `CoverageSetup` and `ScoreEntry` types from `@indxsearch/indx-types`
- Imports `SystemState` enum as value (not just type) for runtime comparisons

### Technical Details

This release aligns `@indxsearch/intrface` with the official IndxCloudApi v1.0.2 Swagger specification. The breaking changes fix discrepancies between the package and the actual API that could cause runtime errors or unexpected behavior.

### Migration Guide

If upgrading from 2.0.x:

1. **SystemStatus access**: Change `statusData.state` to `statusData.systemState`
2. **DocumentKey**: If you're manipulating `documentKey` values, they are now numbers instead of strings
3. **CoverageSetup**: Remove any usage of the deleted properties listed above

### Compatibility

- Requires IndxCloudApi v1.0.2
- Requires `@indxsearch/indx-types` ^1.0.0
- React ^19.0.0
- React DOM ^19.0.0

## [2.0.1] - 2026-01-16

### Fixed

- Fixed search firing 3 times per keystroke instead of 2 (immediate + debounced)
- Fixed reset filters not triggering new search when user clicks "Reset" button
- Fixed filter effect race conditions with automatic range filter cleanups
- Fixed range filter panel automatically triggering searches when cleaning up full-range filters

### Changed

- Added optional `isUserAction` parameter to `resetSingleFilter` method to distinguish between user-initiated actions and automatic code cleanups
- Optimized `coverageSetup` reference preservation in `setSearchSettings` to prevent unnecessary re-renders
- Removed verbose `useMemo` dependencies for `coverageSetup` (replaced with stable reference approach)

### Technical Details

The root cause of the 3-search bug was `RangeFilterPanel` automatically calling `resetSingleFilter` after every search to clean up full-range filters. This was setting the `filtersChangedByUser` flag, causing the filter effect to fire an extra search. The fix distinguishes between user-initiated resets (should trigger search) and automatic cleanups (should not trigger search).

### Compatibility

- Requires IndxCloudApi 1.0.0
- React ^19.0.0
- React DOM ^19.0.0

## [2.0.0] - [Previous Date]

### Added

- Initial public release with major architectural improvements
- Full TypeScript support
- Comprehensive authentication system (bearer token + email/password)
- Error boundary component with fallback UI
- Active filters panel for displaying and managing applied filters
- Range filter panel for numeric filtering
- Value filter panel with checkbox and button display modes
- Sort by panel with dropdown and radio display modes
- Debounced faceted search with optimized performance
- Real-time facet counts and aggregations
- Mobile-responsive design

### Compatibility

- Requires IndxCloudApi 1.0.0
- React ^19.0.0
- React DOM ^19.0.0

---

## How to Update

To update to the latest version:

```bash
npm install @indxsearch/intrface@latest
```

Or with a specific version:

```bash
npm install @indxsearch/intrface@2.1.0
```
