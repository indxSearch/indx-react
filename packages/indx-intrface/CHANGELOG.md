# Changelog

## 4.0.0-beta.1

### Major Changes

- 867e6a3: `removeDuplicates` is gone from `SearchProvider` and the search settings, and searches no longer send it: the server never acted on it. To show one row per title or per work, use the server's `collapseBy`.

## 4.0.0-beta.0

### Major Changes

- 1d26629: Search or ask searches what the visitor types. The Ask phrases are gone: the list is no longer rewritten while a question is typed, and the invitation comes from the judge, which reads a question from its first word in any language. `stripAskPhrases` and the `AskPhrases` type are no longer exported.
- 14cca8a: A page sends only what it sets, so a dataset's query parameters decide the rest (6.0). The provider's
  `mode` is left out unless the page sets it (the dataset's mode, else EditDistance), and
  `setSearchSettings({ match: undefined })` (or `candidates`, `ranking`) hands a whole part back to the
  dataset. The settings panel shows the dataset's values where the page sets none, from
  `query-parameters`' `effective`. While the offer to ask is strong, the page's searches take
  `STRICT_MATCH` (`tolerance: Exact`, `typingPrefixFrom: 0`, `joinedWords: false`; was
  `STRICT_COVERAGE`), and `visibleResults` takes the count of records counted where it took the
  truncation index.
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

- 3b0b1fd: Search or ask follows each of its five modes as the 6.0 server defines them.

  - The list under an offer is never cut. With the server's "strong matches only" gone, the cut emptied the list under most questions. `cutResults`, `cutRule`, `visibleResults`, `DEFAULT_CUT`, `CutRule` and `SCORE_SCALE` are removed.
  - `SearchResults` dims the list, with a line above it, when the judge reads what is asked about as not in the results (`found` below `thresholds.found`). The hook's state has `found` and `notFound`; `notFoundLabel` words the line.
  - While asking is held, nothing is offered in any mode: no Ask button in open, no hint in inviting, no answer starting in proactive, and Enter searches. That is when the model provider refuses answers (reason `paused`) or the dataset's calls for today are spent. The state says so as `held`.
  - `AskPanel` tells a refusal apart: a proactive start the server refuses shows nothing, a spent budget says asking is back tomorrow, and asking that is not on here gets a sentence for the visitor rather than the server's text for the owner.
  - An intent answering 404 (the dataset does not show Search or ask) turns the hook off, as a 409 does.
  - `SearchOrAskMode` and `pageMode` are exported. The hook's `mode` doc now says what it does: a page's `proactive` is `inviting` where the dataset is not proactive.
  - `setSearchRewrite`, the Ask phrases' hook into the provider, is gone; the provider's `searchTextOf` stays.
  - `QuickAnswer` shows the plain Ask of open, inviting and proactive (a new `ask` quick state, `labels.ask`), so a page that puts the offer in a row of its own keeps the Ask that those modes always have. `SearchInput`'s chip reads the same state.

- 75714b7: On a catalogue, the assistant's picks are the result list while the conversation is open, with nothing for the page to wire. The answer chooses the records that answer the visitor by reading them, best first, each with why. `AskPanel` puts them on the `SearchProvider` (`picks`, `showPicks`); `SearchResults` lists them in place of the search, numbered as the answer cites them, with the reason under each row, and a way back ("Show the search instead", or "Show all 45 found" when the picks came with a search); `SearchInput` drops its Nearest and No results chips, which are about the search. Typing, Clear, a new conversation or the panel going gives the list back. A proactive answer leaves the list alone. `AskPanel`'s `onPicks` reports them and `listPicks={false}` keeps them in the panel; `SearchResults` takes `picks` and `onShowSearch` to override. A pick opened is reported against the answer, and a follow-up sends the picks as what the last turn showed (`AskTurn.shown.picks`). New types `AskPick`, `AskPicks`.

### Minor Changes

- 0b3925e: `filters/combine` takes a list. `CombinedFilterProxy` is `{ filters: FilterProxy[], useAndOperation }`
  in place of `{ a, b, useAndOperation }`, and the server makes one filter of the whole list. The
  intrface sends one combine per field and one for the whole selection, where it sent one per pair:
  three values on one field were two requests and are one. Needs a server with the list form.
- 496a2dc: The search state keeps the rest of what a 6.0 search says about itself: `toleranceCounts` (the
  counted records by typo level, for "140 results, 45 with a typo"), `countedTolerance`, `ranked`,
  `reranked` and `fill`, beside `countedTotal` and `isFallback`.

### Patch Changes

- 342e1a4: A search asks the server to send the records with its answer, so each search is one call instead of a search followed by a lookup. A server that does not send them yet is asked for them as before.
- 2c89d15: Search or ask offers to answer once the question is whole. While a question is still being typed ("which school is"), the visitor sees the invitation, and the offer to answer follows when the rest is there.
- Updated dependencies [c4f1ecb]
- Updated dependencies [0b3925e]
- Updated dependencies [a880596]
- Updated dependencies [c3d895c]
- Updated dependencies [9085f78]
- Updated dependencies [a394c82]
- Updated dependencies [1ba5cc7]
- Updated dependencies [c4ff027]
- Updated dependencies [9bd6669]
- Updated dependencies [4829cc7]
- Updated dependencies [496a2dc]
  - @indxsearch/systm@2.25.0-beta.0
  - @indxsearch/indx-types@4.0.0-beta.0

## 3.15.1

### Patch Changes

- `SearchResults` offers Load more whenever the server may hold more results, so the first page no longer ends without it when the provider fetches fewer results than the page shows.
- Clearing the search field with `allowEmptySearch` off keeps it clear: a search still on its way no longer brings the previous results back.
- Text typed before the provider has finished starting up is searched as soon as it is ready.
- `useVectorSearch` and `useHybridSearch` show the results of the latest search when several overlap, and their loading state follows that search.
- Search or ask shows an answer as it is being written even when a catalogue's answer starts before its sources arrive.
- Updated dependencies
  - @indxsearch/indx-types@3.1.0

## 3.15.0

### Minor Changes

- Search or ask follows the dataset's new mode, from the most careful to the most forward: `strict` shows only the full offer, `soft` (the default, as before) invites early, `open` keeps an Ask button in the field and lets Enter ask whatever the judge says, `inviting` adds an invitation that sweeps as soon as the judge reads a question starting, and `proactive` also starts the answer on its own once the judge is sure, reads the question as finished, and the visitor has stopped typing for a second (`answerAfterMs`). No word lists: the judge reads any language. `SearchInput` then calls `onAsk(text, { proactive: true })`; pass `proactive` on to `AskPanel` so the statistics count those answers apart. `useSearchOrAsk({ mode })` lets a page choose its own mode; `proactive` applies only where the dataset is set to proactive, and is `inviting` elsewhere.
- `SearchInput`'s filter count opens the active filters in a popover, to see them and remove them one by one; it closes once the last is gone.
- `QuickAnswer`, Search or ask's offer as a row of its own for above the results, as Notion's quick answer: "For a quick answer, type a bit more" sweeping while a question is typed, the full offer once it is sure, or in proactive "Thinking" until the answer starts on its own, never a button to press. `useSearchOrAsk` gives the one `quick` state it draws, which `SearchInput`'s chip and `askOffer="below"` draw too.
- `useSearchOrAsk` asks the judge while the visitor types too, so the offer to answer can appear as soon as they stop instead of a moment after. Pass `prefetch: false` to ask only on the pause.

### Patch Changes

- Updated dependencies
  - @indxsearch/systm@2.24.0

## 3.14.0

### Minor Changes

- 4aa88f7: `convertResult(documentKey, type, { quantity?, queryId? })` on the search context reports a conversion, such as an order or an add to cart, to the dataset's statistics. It is credited to the search the document was chosen from, even after the visitor has searched again. It never throws.

### Patch Changes

- Updated dependencies [ee2c6be]
- Updated dependencies [975a6fc]
- Updated dependencies [3aef120]
- Updated dependencies [42a4481]
- Updated dependencies [0aa041a]
- Updated dependencies [0245481]
- Updated dependencies [4aa88f7]
- Updated dependencies [b2a34bd]
- Updated dependencies [08dcd53]
- Updated dependencies [8aab4c1]
- Updated dependencies [3635b41]
- Updated dependencies [9b63f48]
  - @indxsearch/systm@2.23.0

## 3.13.2

### Patch Changes

- f7ff44a: `SearchInput` takes `askOffer="none"`: the field shows no offer to ask, for a page that shows the offer itself from `searchOrAsk`. Enter still asks on a strong offer. The Ask button's Enter hint is a key-cap reading Enter ↵.
- 4ba7f51: Every search carries `locale`, the page's language for the statistics: `SearchProvider`'s `locale` prop, else the document's `lang`, else the browser's. The dataset's Statistics overview shows which languages people search in. Nothing about where they are is sent.
- Updated dependencies [a848bf1]
- Updated dependencies [1bcaa7f]
- Updated dependencies [79f891e]
- Updated dependencies [029a381]
- Updated dependencies [a8c906a]
- Updated dependencies [c946a3c]
- Updated dependencies [1e09a2a]
- Updated dependencies [f684405]
- Updated dependencies [6e9b5f5]
- Updated dependencies [7a0fa0c]
- Updated dependencies [24d1515]
- Updated dependencies [2eb549c]
- Updated dependencies [9f9190f]
- Updated dependencies [e542d87]
- Updated dependencies [9e71991]
- Updated dependencies [0e126c1]
- Updated dependencies [3dcb304]
- Updated dependencies [13eb480]
- Updated dependencies [b6456d0]
- Updated dependencies [ce4a08f]
- Updated dependencies [373382a]
- Updated dependencies [c659761]
  - @indxsearch/systm@2.22.0

## 3.13.1

### Patch Changes

- When the page searches something other than what the visitor typed, the search also carries the typed text. The statistics then count a visitor's typing as one search, instead of a search for every step along the way.
- Updated dependencies
  - @indxsearch/systm@2.21.1

## 3.13.0

### Minor Changes

- SearchResults takes `showScore`, to show or hide each result's score from code. Given, it wins over the toggle in SearchSettingsPanel; left out, the toggle decides, as before.

### Patch Changes

- bac9b80: SearchField has a built-in Clear button. It shows while the field holds text and puts the focus back in the field. Turn it off with `clearable={false}`. SearchInput keeps its own Clear, which also resets the filters.
- Updated dependencies [ffda712]
- Updated dependencies
- Updated dependencies [bac9b80]
- Updated dependencies
- Updated dependencies [f1bb38b]
  - @indxsearch/systm@2.21.0

## 3.12.0

### Minor Changes

- 1533dad: SearchInput shows what the search is doing. A blue chip counts the active filters. A Nearest chip appears when nothing matched your words directly and the list holds the nearest results instead; its tooltip says so. A No results chip appears when a search returns nothing. There is one Clear button, and it now resets the query and the filters together, so it also shows on an empty search with filters set. `showStatus={false}` hides the chips.

  SearchField leaves room for what sits on its right, such as a Clear button or chips, so typed text no longer runs underneath them.

  The search icon lights up only while the input has focus. Clicking Clear used to light it for a moment.

- 43b8279: SearchResults shows a failed search as a state the visitor can read, not as an error message. Each kind of failure has its own icon and a short line: the server can't be reached, the key was not accepted or has no access, the dataset doesn't exist, the dataset is getting ready, too many searches, or a server error. Under it, a small technical line tells whoever built the page what happened and what to do. Where trying again can help there is a Try again button, and a dataset that is still loading or indexing is retried by itself when the server says it is ready.

  No results now shows nothing in the list, since SearchInput says it in the field.

  For your own components, the context has `retry()`, and `authErrorInfo` and `state.errorInfo` next to the existing messages, with the kind of failure, whether retrying can help, and the technical line. `describeSearchError` classifies any error the same way, and `SearchResultsMessage` is the component SearchResults uses, if you want it elsewhere.

  A key that cannot reach the dataset (403) used to be reported as a failed connection. The startup messages in `authError` now follow the same form as search errors, for example "Dataset status failed: HTTP 404".

### Patch Changes

- 383e0f5: Filter panels are calmer when something is wrong. A panel whose field isn't set up for it (not Filterable, or not Facetable for a value panel) no longer shows a red message: it keeps its title, says "Not available" in muted text, names the missing role in a small technical line, and tells the console what to change. When the search fails to start, the filter panels step aside instead of each reporting its field as broken or showing a loading skeleton that never ends; the results area explains the failure once.
- Updated dependencies [f9400f4]
- Updated dependencies [1533dad]
  - @indxsearch/systm@2.20.0

## 3.11.0

### Minor Changes

- 8052579: A search now sends only the coverage settings you set. Leave one out and the dataset decides it, from the new Query parameters tab on Indx server, so a site owner can tune typo tolerance, truncation and the rest without a new release of the page. What you pass in `initialCoverageSetup` or `coverageDepth` still wins, one setting at a time. Against a server without query parameters nothing changes: it fills in the same defaults this package used to send. `SearchSettingsPanel` shows where each value comes from and can hand them all back to the dataset. `SearchSettings.coverageSetup` holds only the values the page sets, and `coverageDepth` is optional; the `RequiredCoverageSetup` type is gone.

## 3.10.0

### Minor Changes

- a0c776b: `SearchProvider` takes two optional props for the dataset's statistics. `source` names the search surface when a dataset has more than one (`source="header"`, `source="app"`): it is sent with every search, and those searches are counted as usual. `count={false}` keeps a page's searches and the results chosen from them out of the statistics while they are still stored, for a test page or an internal tool. Without either, nothing changes.
- 5b50d4e: SortByPanel: offer your own sort choices with readable labels. Pass `options`, such as `{ field: 'votes', ascending: false, label: 'Most voted' }`, and the panel shows those choices in that order instead of every sortable field by its field name. `noneLabel` renames the choice that turns sorting off ("Relevance"), or drops it with `null`. Without `options` the panel works as before.

### Patch Changes

- 7cd07a7: RangeFilterPanel: a `step` that does not divide the field's range no longer breaks the page. Ratings from 5.3 to 8.7 with `step={0.5}` used to crash on load; now the slider works and still reaches the highest value. Histograms on narrow decimal ranges, such as ratings, now get about twenty bars without setting `resolution`, instead of three or four.
- Updated dependencies [257de84]
  - @indxsearch/indx-types@3.0.0

## 3.9.1

### Patch Changes

- 1c09506: ActiveFiltersPanel: the chips line up with the panel heading on every page. The list no longer picks up the browser's default indent and margins when the page does not reset lists itself.
- Updated dependencies [34c676b]
  - @indxsearch/systm@2.17.0

## 3.9.0

### Minor Changes

- c71faf3: Your search page now feeds the dataset's Statistics tab. Every search carries a session id for the page load, so the server counts the search a visitor settled on rather than every keystroke. And a result can report that it was chosen: the `SearchResults` render function gets a second argument with `select()`, and the context has `selectResult(result)`. Call it from the click that opens a result, and click-through and click position show up in Statistics. Each result now also carries its `position` in the list. Nothing to configure, and a page that never calls `select()` works as before.

### Patch Changes

- Updated dependencies
- Updated dependencies [c2443e5]
  - @indxsearch/systm@2.16.0

## 3.8.0

### Minor Changes

- d5e93d4: A selected value on a numeric field is sent as a range filter with equal limits instead of a value filter. A value filter compares text, so on a number it was slow and missed `129.0` when asked for `129`; a range with equal limits is numeric equality through the field's index. The field types come from `GET fields/configuration`, fetched once at start beside the three field lists, and are exposed as `fieldTypes` on the search state. Against an older server that still answers 403 to a Search key on that call, nothing changes: every selection stays a value filter.

## 3.7.2

### Patch Changes

- RangeFilterPanel: every value now owns a cell one step wide, and the upper thumb sits at the end of its value's cell, so the slider runs one step past the field's max. Histogram bars touch again instead of leaving a one-step gap between buckets, and a clicked bar's edges still sit exactly under both thumbs. The filter and the Min and Max inputs are unchanged: a 2004 to 2008 selection still filters on 2004 to 2008. When the thumbs meet, the selection stays one value wide.

## 3.7.1

### Patch Changes

- 657eb06: RangeFilterPanel: a histogram bar now ends at its last value instead of at the next bucket's first, so after clicking a bar its right edge sits under the max thumb and at the end of the track's highlight. Before, it ran one step past both. The step between buckets, which holds no values, is left empty with the separator in it.

## 3.7.0

### Minor Changes

- RangeFilterPanel: a new `stepMarks` prop draws a small bar at every step of the slider, `"below"` in a row under the track or `"inline"` across it, so a coarse `step` shows where the thumbs will snap. It is passed straight to the systm `Slider`, and like there it draws nothing past 50 steps.

### Patch Changes

- Updated dependencies [401b272]
- Updated dependencies
  - @indxsearch/systm@2.15.0

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
