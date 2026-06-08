---
"@indxsearch/systm": patch
"@indxsearch/indx-types": patch
---

Packaging hygiene. Add a `prepublishOnly` build guard so a fresh checkout can't publish a stale or empty `dist`. `@indxsearch/indx-types` no longer ships dead `.d.ts.map` files (it doesn't publish `src`), and `@indxsearch/systm` now includes its `CHANGELOG.md` in the published tarball.
