---
# folio-assistant-byql
title: Fold detangle and kg-navigation into cat-harness — views of the harness, not layers of their own
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T17:02:35Z
updated_at: 2026-09-23T17:02:35Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23, on the 3 undetermined edges j79e's classifier reported (detangle.json and kg-navigation.json declare no `needs`): *"Make them visualization of an existing harness"*, then from the options offered chose **Fold into cat-harness**: move both under cat-harness as declared directories and drop their instance files.

This reverses the 2026-09-20 ruling that kg-navigation be a top-level named subgraph, at the owner's direction.

## Done when
- [x] moved with git mv (history kept), into the harness's standard homes:
  - `kg-navigation/skills/*` → `cat-harness/skills/kg-navigation/` (a package of the `skills/` graph)
  - `detangle/schemas/*.ts` → `cat-harness/schemas/`, `detangle/scripts/kg-detangle.ts` → `cat-harness/scripts/`
  - `detangle/results/` → `cat-harness/test/results/detangle/` (under the declared `qa` directory)
  - `detangle/README.md` + `AGENTS.md` → `cat-harness/docs/detangle.md` (AGENTS.md's rules kept verbatim as a section)
- [x] `detangle.json` and `kg-navigation.json` removed; their three directory entries in `cat-harness.json` removed too — the existing `skills`, `schemas` and `qa` declarations cover the new homes
- [ ] every hand-written reference updated; generated ones regenerated
- [x] kg:detangle reports 0 undetermined edges repository-wide
- [ ] `bun run gates` green
- [x] the two kg-navigation bodies (bootstrap's and the tooled one) are both still addressable (bean v3se)

## Why not `cat-harness/detangle/` and `cat-harness/kg-navigation/` as declared directories

Tried first, and measured wrong:

- `skill_fetch` names a directly-held directory basenamed `skills` after its
  INSTANCE, and an instance's only directly-held directory also takes the
  instance name. Both `cat-harness/kg-navigation/skills/` and
  `cat-harness/kg-navigation/` served the package as **`cat-harness`**.
- Once detangle's `schemas/` and `results/` were instance-scoped, cat-harness
  declared two `schemas` and two `qa` directories. `check:tools`,
  `kg:schema:check`, `kg:audit`, `gen-schema-docs` and `gen-docs-pages` each
  require exactly one; `scope: repository` had been what hid it.

So both were folded all the way into the homes their siblings already use.
`kg-detangle.ts` now finds its results directory by the declared `qa` id, as
`kg-audit` does.
