---
# folio-assistant-sfhr
title: 'STORE DEFECTS the check does not see: an empty in-progress body, a title that ate its Done-when, a blocker on a scrapped bean'
status: in-progress
type: bug
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T19:00:00Z
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

---

_2026-09-20T19:00Z_ — **Done-when 1 landed** (PR #589, issue #588).
`bun run check:bean-bodies` reports all three: an empty body on an open bean, a
`title:` block scalar that continues into the body, and a prose ``blocked on
`id` `` whose target is `completed` or `scrapped`. It found `70c7`, `52dz` and
`nvbr` exactly as this bean describes them, **and five more beside them** —
`1r0p`, `d5f1`, `ktt2`, `rnfl` and `y1w9`, all blocked on a bean that is closed.

Two false-positive classes were measured and closed rather than tolerated. The
id must be **in a code span and id-shaped**: a bare word matched *"blocked on
there being a dataset"*, *"blocked on effort"* and five others. And a match
**inside a quotation** is skipped — this bean quotes `nvbr`'s blocker, and the
first draft reported that as `sfhr`'s own dead blocker, which would have made
the check's first finding a misreading of its own specification.

Baselined at the eight the store has, per this bean's own instruction that they
are repaired **by their owners**: a NEW defect fails, the backlog is listed, and
a baseline entry that stops matching is reported as stale so the file shrinks.
Wired into `code-quality-gates.yml`.

- [x] A check reports: empty body on an open bean, multi-line title, and a "blocked on `<id>`" in prose whose target is scrapped or completed
- [ ] The three beans above are repaired by their owners (this bean does not edit them)
