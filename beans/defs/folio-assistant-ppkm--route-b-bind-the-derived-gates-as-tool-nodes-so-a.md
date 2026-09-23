---
# folio-assistant-ppkm
title: 'ROUTE B: bind the derived gates as Tool nodes, so a downstream instance inherits them'
status: completed
type: feature
priority: normal
created_at: 2026-09-20T08:40:51Z
updated_at: 2026-09-20T08:48:04Z
parent: folio-assistant-zzmr
---


Route B of `folio-assistant-3lbz` (`cat-harness/docs/proposals/zod-schemas-as-tools.md`),
authorised by the owner as "route B y".

## What was asked, and what was built

The proposal's route B reads naturally as **one Tool node per gate** — 43 of
them. What landed is **one parameterised node**, `gates`, and that deviation is
the substance of this bean rather than a shortcut taken under it.

Three reasons, in the order they were measured:

1. **The proposal itself named the cost.** Hand-written per-gate nodes make
   `tools/` A SECOND ANSWER to "what are the gates", free to disagree with
   `cat-harness/scripts/gates.ts` the moment either changes. `gates.ts` derives
   the list from `.github/workflows/code-quality-gates.yml`, so 43 nodes would
   be 43 copies of a fact that is already computed. The whole reason the sweep
   is derived is that a hand-kept list drifted.
2. **There is nothing to bind them to.** `Gate` carries `{ job, step, command }`
   and **no skill binding**. Each of the 43 would need an invented
   `satisfies:` — 43 judgements, none derived from anything, all of them mine.
3. **Route A settled the same question one bean earlier**, on the owner's own
   instruction about Zod schemas: *"a Tool per Zod schema... no, but there
   should be common patterns (single pattern?) with some parameters more or
   less"*. `kg-validate` is one node with the kind as a parameter for exactly
   this reason, and it says so in its own description.

Per-gate discoverability is still reachable and the route to it is named in the
code: give `Gate` a declared skill **in the workflow the list is derived from**,
not in a hand-maintained node list here.

## Why the node exists at all

`tools/` is an **inherited** declaration; `.github/workflows/` is not. A
downstream instance inherits this Tool node and **none of the 43 gates it
names**, so without it the only answer to "what checks this?" lives in a file
that does not travel. #363's self-sovereign topology has no CI at all.

## What is checked

`cat-harness/scripts/tests/tools.test.ts`, §"the gates Tool":

- `invoke.shell` names a script that exists in `package.json` — the failure the
  schema cannot catch, since `invoke.shell` is prose to it.
- Every declared flag is one `gates.ts` actually reads. A node advertising an
  option the script ignores fails **silently**: it runs the default and reports
  success.
- **Exactly one** gate Tool. If a later change starts minting per-gate nodes
  this fails, and the author has to argue for it rather than drift into it.
- All three `selection` fields present, and `when` carries the inheritance
  asymmetry rather than leaving it to the reader.

## Done when

- [x] `gates` Tool node in `cat-harness/tools/index.ts`, with the deviation
      argued in the code and not only here
- [x] tests pinning command, flags, node count and selection prose
- [x] `bun run check:tools` passes — satisfies resolves, io types declared
- [x] `bun run gates` green (43/43)
