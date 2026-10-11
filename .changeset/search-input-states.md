---
"@indxsearch/intrface": minor
"@indxsearch/systm": patch
---

SearchInput shows what the search is doing. A blue chip counts the active filters. A Nearest chip appears when nothing matched your words directly and the list holds the nearest results instead; its tooltip says so. A No results chip appears when a search returns nothing. There is one Clear button, and it now resets the query and the filters together, so it also shows on an empty search with filters set. `showStatus={false}` hides the chips.

SearchField leaves room for what sits on its right, such as a Clear button or chips, so typed text no longer runs underneath them.

The search icon lights up only while the input has focus. Clicking Clear used to light it for a moment.
