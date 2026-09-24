---
"@indxsearch/systm": patch
---

SaveBar: only as wide as its buttons, hugging the start edge, with a gap on the left, right and bottom, so the content it sticks over stays visible along the edges instead of being cut off by a full-width band. The background is very slightly see-through with a light blur behind it, which keeps the bar readable over a busy table while showing that something continues underneath. A browser without `backdrop-filter` gets the plain page tone, as before. The aside now sits after the message rather than at the far edge, since there is no width to spread across. `--savebar-gap` sets the gap; `--savebar-bg` still overrides the background outright.
