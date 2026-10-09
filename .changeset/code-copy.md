---
"@indxsearch/systm": minor
---

New `CodeCopy`: a one-line command with a copy button, like the install line on a package page. Give it `code` and it shows the text in a monospace field as tall as a default Button, so it sits in a row of buttons. After a copy the icon turns into a check for two seconds and screen readers hear "Copied". It also copies on a plain http page, where the browser's clipboard API is not available. A long command scrolls sideways instead of wrapping.

New `--font-mono` token for code, commands and keys: Geist Mono, falling back to the system's monospace font. The app loads the Geist Mono face itself, for example with `@fontsource/geist-mono`.
