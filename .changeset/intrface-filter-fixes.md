---
"@indxsearch/intrface": minor
---

Filter, settings and error-handling fixes across the components.

- Several selected values on the **same** field are now ORed (a document matches any of them) before the per-field results are ANDed together with the range filters. Previously every value was ANDed, so ticking a second box in one panel returned nothing.
- A failed `/filters/*` call, search or document lookup now sets `state.error` instead of silently running an unfiltered search or showing an empty result. `SearchResults` renders `authError` / `state.error` in place of the idle placeholder.
- `ValueFilterPanel` with `displayType="toggle"` stays on and clickable after the filtered response narrows the facet to `{ true }` only (or removes it). The `null → false` merge now applies to boolean toggles only, so `showNull` works on checkbox and button panels and no `false` option is fabricated for non-boolean fields.
- `RangeFilterPanel` Min/Max inputs keep what you type and commit (clamp/revert) on blur or Enter instead of clamping every keystroke. The panel now reports a field that is not filterable instead of rendering a slider whose filter the server rejects.
- `SearchSettingsPanel` changes now trigger a new search. A `maxNumberOfRecordsToReturn` set through `setSearchSettings` survives query changes; the "load more" expansion still resets.
- Filter and sort changes refresh results when `enableFacets={false}`.
- **Breaking:** `SearchResults` no longer splits string values that start with `[` into arrays. Opt in with the new `parseArrayStrings` prop, which parses only proper JSON or Python-style list literals.
- `SearchErrorBoundary` documents that it catches render errors only and uses the systm `Button`.
