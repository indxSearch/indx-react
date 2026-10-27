---
"@indxsearch/systm": minor
---

Chat: `ToolStep` and `ToolSteps` show what an assistant did on its way to an answer, one line per step with what came of it (`meta`). A running step has the same spinner as `StreamStatus`, a finished one the tool's icon, a failed one the error mark. With `detail` the row opens to show what went in and what came back. `ChatPanel` now shows a Latest button over the thread while it is scrolled up from the newest turn; `jumpToLatest={false}` leaves it out.
