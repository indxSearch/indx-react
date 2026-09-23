---
"@indxsearch/systm": minor
---

NavigationMenu: the shared panel opens under the trigger that opened it, clamped so it never leaves the menu. `align` now moves the list only, which is the layout choice it always was. A menu whose dropdown is not the edge-most item no longer drops its panel at the far edge, detached from the button it belongs to. `panelAlign="start"` or `"end"` pins the panel to an edge instead, which is the old behaviour.
