# Changelog

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
