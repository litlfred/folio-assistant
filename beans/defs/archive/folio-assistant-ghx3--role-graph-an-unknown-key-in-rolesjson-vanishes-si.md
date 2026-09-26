---
# folio-assistant-ghx3
title: 'ROLE GRAPH: an unknown key in roles.json vanishes silently — RoleDefSchema should be strict'
status: completed
type: task
priority: normal
created_at: 2026-09-20T04:13:53Z
updated_at: 2026-09-20T04:23:49Z
parent: folio-assistant-zzmr
---


**Found 2026-09-20 while merging main into #452**, per the owner's standing
"watch all open PRs for incoming insights".

## The doc defect caused the data defect, one merge apart

`role-model.md` §"Adding a role" step 1 said *"with a `summary`"* and
*"`actorKind` is …"*. Neither is a field:

| written | actual | why |
|---|---|---|
| `summary` | `description` | `title`/`description` are the two labels EVERY kg node carries (`RoleDef.title`'s own comment) |
| `actorKind` | `actorKinds` | a SET — settled by the corpus, §"An actor is one of three kinds" |

PR #453 added three bootstrap roles by following that instruction, so
`bootstrap/scenarios/roles.json` now carries a `summary` on all three.
**Zod strips an unknown key**, so the text parses, type-checks, and reaches
no graph. Measured: 0 of 33 root roles carry `summary`; 3 of 3 bootstrap
roles do.

The instruction is corrected in #452 (the file was already open there).
**This bean is the other two halves**, which are not that PR's business:

## Done when

- [ ] `RoleDefSchema` is `.strict()`, so an unknown key THROWS at read
      rather than vanishing. `readRoleGraph` already throws on a bad
      `actorKinds` and on a dangling `inherits` — *"rejected at read, not
      accepted and…"* — so this is that same posture applied to the case
      it currently misses. `zdrf` is the recorded instance of the class:
      *"a field TypeScript accepts and Zod strips is written by an author,
      type-checks, and vanishes."*
- [ ] the three bootstrap roles either lose `summary` or its content is
      folded into `description`. **Not a silent delete** — it is another
      session's prose, and the text may say something `description` does
      not. Read both before choosing.
- [ ] a test that a role carrying an unknown key is refused, so the guard
      cannot be relaxed back by accident.

## Do NOT

Add `summary` to the schema to make the data valid. That re-splits the
label pair `title`/`description` exists to unify, and the comment on
`RoleDef.title` gives the cost: a consumer would have to know which kind
of node it held before it could print one.
