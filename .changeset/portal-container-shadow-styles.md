---
"@indxsearch/systm": minor
---

systm can render inside a shadow root. `PortalContainerProvider` names where the floating parts (Modal, Select, Tooltip, Popover, DatePicker, the Breadcrumbs' switchers) render, so they stay inside the root instead of going to `document.body`; without it nothing changes. `@indxsearch/systm/styles.shadow.css` is the stylesheet for a shadow root, its tokens and page rules on `:host`.
