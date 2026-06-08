---
"@indxsearch/intrface": patch
---

Fix broken TypeScript types. Declarations are now emitted to `dist/index.d.ts` (matching the package's `types` entry) instead of being nested under `dist/src/`, so consumers get full type information again. Internal test and mock declarations are no longer included in the published tarball. Also adds a `prepublishOnly` build guard.
