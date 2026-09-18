---
"@indxsearch/systm": patch
---

InputField shrinks inside flex rows and grid columns: the wrapper has `min-width: 0` and the input fills it (`width: 100%`, `box-sizing: border-box`). App-level overrides on the wrapper and input are no longer needed.
