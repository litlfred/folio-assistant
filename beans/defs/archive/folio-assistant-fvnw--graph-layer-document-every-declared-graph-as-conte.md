---
# folio-assistant-fvnw
title: 'GRAPH LAYER: document every declared graph as content or state, in a SKILL'
status: completed
type: task
priority: high
created_at: 2026-09-20T05:04:19Z
updated_at: 2026-09-20T05:14:17Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-20: *"make sure all things explained in skills"*. Not in
`AGENTS.md`, not in `harness.json` prose — the repo's own rule is that a rule
living only in `AGENTS.md` is a rule with no home.

## Summary of Changes

`skills/folio-core/content-context-and-state-graphs.md`:

- The definition of each side, stated so it can be applied rather than recalled.
- **The two questions** that settle a hard case: does it stand on its own when
  detached, and would you regenerate it or re-author it. Plus what to do when
  they disagree — say so rather than picking, because a shape the axis has not
  met is how a vocabulary acquires a category nobody can use.
- The reasoning for the four non-obvious kinds. `uploads` / `library` is the
  pair worth reading: the same PDF is state in one directory and content in the
  other, which is the clearest proof the axis is not about file type.
- What a consumer may assume about each side, and that a state graph is the one
  that can be STALE — content is wrong or right, state is wrong, right, or
  about a version that has moved on.
- Adding a kind: why there is no third value (a third state is right when a
  CHECK could not tell, wrong when an AUTHOR is defining the kind), and that
  `holds` is part of a kind's identity.
- The open question about agent memory, stated as open, with the complication
  that settles nothing: `todos/` is labelled *memory* in the 2x2 and holds
  OUTSTANDING ITEMS, which is workflow-management-shaped. Bean `mhh9`.

**No count anywhere in it, on purpose** — `graphKindsOfLayer()` returns the
live answer and the page cannot go stale against it.

`directory-conventions.md` and `AGENTS.md` get POINTERS. Neither restates the
rule.

## Done when

- [x] one skill carries the definition, the questions and the classification
- [x] the non-obvious kinds carry their reasoning, not just their verdict
- [x] `directory-conventions.md` points at it from both places a reader arrives
- [x] `AGENTS.md` points at it and states no rule of its own
- [x] listed in `skills/folio-core/package-manifest.json`
