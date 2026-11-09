---
"@indxsearch/intrface": major
---

Search or ask follows each of its five modes as the 6.0 server defines them.

- The list under an offer is never cut. With the server's "strong matches only" gone, the cut emptied the list under most questions. `cutResults`, `cutRule`, `visibleResults`, `DEFAULT_CUT`, `CutRule` and `SCORE_SCALE` are removed.
- `SearchResults` dims the list, with a line above it, when the judge reads what is asked about as not in the results (`found` below `thresholds.found`). The hook's state has `found` and `notFound`; `notFoundLabel` words the line.
- While asking is held, nothing is offered in any mode: no Ask button in open, no hint in inviting, no answer starting in proactive, and Enter searches. That is when the model provider refuses answers (reason `paused`) or the dataset's calls for today are spent. The state says so as `held`.
- `AskPanel` tells a refusal apart: a proactive start the server refuses shows nothing, a spent budget says asking is back tomorrow, and asking that is not on here gets a sentence for the visitor rather than the server's text for the owner.
- An intent answering 404 (the dataset does not show Search or ask) turns the hook off, as a 409 does.
- `SearchOrAskMode` and `pageMode` are exported. The hook's `mode` doc now says what it does: a page's `proactive` is `inviting` where the dataset is not proactive.
- `setSearchRewrite`, the Ask phrases' hook into the provider, is gone; the provider's `searchTextOf` stays.
