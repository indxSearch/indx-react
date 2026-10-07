---
"@indxsearch/intrface": minor
---

A search now sends only the coverage settings you set. Leave one out and the dataset decides it, from the new Query parameters tab on Indx server, so a site owner can tune typo tolerance, truncation and the rest without a new release of the page. What you pass in `initialCoverageSetup` or `coverageDepth` still wins, one setting at a time. Against a server without query parameters nothing changes: it fills in the same defaults this package used to send. `SearchSettingsPanel` shows where each value comes from and can hand them all back to the dataset. `SearchSettings.coverageSetup` holds only the values the page sets, and `coverageDepth` is optional; the `RequiredCoverageSetup` type is gone.
