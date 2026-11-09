---
"@indxsearch/intrface": major
---

On a catalogue, the assistant's picks are the result list while the conversation is open. The answer chooses the records that answer the visitor by reading them, best first, each with why, and `AskPanel`'s new `onPicks` hands them over (`AskPick`, `AskPicks`). `SearchResults` takes them as `picks` and lists them in place of the search, numbered as the answer cites them, with the reason under each title; `onShowSearch` is the way back, "Show the search instead" or "Show all 45 found" when the picks came with a search. A pick opened is reported against the answer. A follow-up sends the picks as what the last turn showed (`AskTurn.shown.picks`), and the panel lists every pick under "Picked". The picks stand for the text in the field when they came: typing or Clear gives the list back to the search.
