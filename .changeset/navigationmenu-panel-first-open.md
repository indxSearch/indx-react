---
"@indxsearch/systm": patch
---

NavigationMenu: the panel is already under its trigger the first time it opens. The offset was measured into state, so it arrived a render after the panel was visible and the panel was seen sliding in from the start edge. It is now written straight to the element in a layout effect, and the transition is suppressed for an open and for a reflow while open, so only a move from one trigger to the next animates.
