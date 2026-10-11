---
"@indxsearch/intrface": minor
---

SearchResults shows a failed search as a state the visitor can read, not as an error message. Each kind of failure has its own icon and a short line: the server can't be reached, the key was not accepted or has no access, the dataset doesn't exist, the dataset is getting ready, too many searches, or a server error. Under it, a small technical line tells whoever built the page what happened and what to do. Where trying again can help there is a Try again button, and a dataset that is still loading or indexing is retried by itself when the server says it is ready.

No results now shows nothing in the list, since SearchInput says it in the field.

For your own components, the context has `retry()`, and `authErrorInfo` and `state.errorInfo` next to the existing messages, with the kind of failure, whether retrying can help, and the technical line. `describeSearchError` classifies any error the same way, and `SearchResultsMessage` is the component SearchResults uses, if you want it elsewhere.

A key that cannot reach the dataset (403) used to be reported as a failed connection. The startup messages in `authError` now follow the same form as search errors, for example "Dataset status failed: HTTP 404".
