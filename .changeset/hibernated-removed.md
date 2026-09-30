---
'@indxsearch/indx-types': major
---

`SystemState.Hibernated` (-1) is removed, matching the server: hibernation is no longer a state
of its own. A hibernated dataset reports `Created` and its status carries `recordsOnDisk > 0`
(new field, with `fieldsDiscovered` beside it); the library's `Hibernate()` lands in `Loaded`.
Code switching on `Hibernated` or comparing `systemState === -1` should derive it instead:
`state === SystemState.Created && recordsOnDisk > 0`.
