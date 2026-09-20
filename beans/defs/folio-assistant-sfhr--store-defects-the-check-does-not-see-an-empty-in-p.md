---
# folio-assistant-sfhr
title: 'STORE DEFECTS the check does not see: an empty in-progress body, a title that ate its Done-when, a blocker on a scrapped bean'
status: todo
type: bug
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T18:05:19Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
`beans check` passes ("No link issues found"), and three beans are unreadable by the tooling or by a person: `70c7` is `in-progress` with an EMPTY body (front matter only); `52dz`'s `title: |-` block swallowed the first ~10 lines of its body, including a `## Done when` with three unchecked boxes; `nvbr` is "blocked on bean `fsch`", which is `scrapped` in the archive.

## The gap
todo-manager says a bean carries its Done-when and its blockers; nothing checks that a bean HAS a body, that its title is one line, or that a prose blocker names a live bean. The link check covers front-matter links only.

## Done when
- [ ] A check reports: empty body on an open bean, multi-line title, and a "blocked on `<id>`" in prose whose target is scrapped or completed
- [ ] The three beans above are repaired by their owners (this bean does not edit them)
