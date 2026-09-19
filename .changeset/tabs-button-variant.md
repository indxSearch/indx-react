---
"@indxsearch/systm": minor
---

Tabs: `variant="button"` fills the active tab like a primary Button. Items take `disabled` with a `title` for the reason (rendered as `aria-disabled`, skipped by the arrow keys), and a `badge`. A scrollable bar now reveals the active tab when it is selected from outside, and no longer scrolls the page when doing so. Items with an `href` turn the bar into a nav of links with `aria-current="page"`, with `renderLink` for router links and `aria-label` to name it. With `scrollable`, `bleed` lets the bar reach out into the gutter beside it, so the edge fade sits in the gutter and the tabs scroll into it; without it the fade is a fixed-slope gradient that slides in from outside the frame.
