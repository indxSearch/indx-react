---
"@indxsearch/intrface": patch
---

Filter panels are calmer when something is wrong. A panel whose field isn't set up for it (not Filterable, or not Facetable for a value panel) no longer shows a red message: it keeps its title, says "Not available" in muted text, names the missing role in a small technical line, and tells the console what to change. When the search fails to start, the filter panels step aside instead of each reporting its field as broken or showing a loading skeleton that never ends; the results area explains the failure once.
