---
# folio-assistant-pve3
title: The root declares HALF of bootstrap — its skills but not its process
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:02:49Z
updated_at: 2026-09-20T04:03:21Z
parent: folio-assistant-vke6
---

## Measured 2026-09-20

The root `harness.json` declares `bootstrap` → `bootstrap/skills/`, so
folio-assistant's graph carries **bootstrap's skills and roles**. It does NOT
declare `bootstrap/workflows/`, so it does not carry **bootstrap's process** —
that isolation was deliberate (#432, where bootstrap's process was leaking into
the root graph 88 times).

So the root carries half of bootstrap. The halves are not independent:

- Bootstrap's roles declared `lanes: ["Initiator"]`. In the ROOT's graph that
  produced `bindsLane → role/Initiator` pointing at a lane node only the
  process collector mints — **three dangling links**, in a graph whose test
  says the count may only go down.
- Bootstrap's `kg-navigation` collides by name with `skills/folio-core/kg-navigation`
  in the root's published docs, and the generator silently drops bootstrap's
  (bean `v3se`). That collision exists *because* root publishes bootstrap's
  skills.

Both are symptoms of the same asymmetry.

## Worked around, not fixed

`lanes` was omitted from `bootstrap/skills/roles/roles.json` to keep the graph
honest without widening the dangling-link allowance — which would have recorded
new debt as progress. Bootstrap's own graph binds correctly either way (0
dangling), because it carries both halves.

## The decision

**Both halves, or neither.** Both means the root re-carries bootstrap's
process, undoing #432's isolation and putting a process the root does not own
into its published graph. Neither means bootstrap's skills stop appearing in
folio-assistant's docs — which also resolves `v3se` — at the cost of
bootstrap's skills being published only through `bootstrap.jsonld`.

The declaration's own rationale argues for carrying the skills ("the first
real use of the topical layout"). That argument was written before bootstrap
had a process, a role graph and a committed graph of its own.

## Done when

- [ ] root declares both halves of bootstrap or neither, with the reason stated
- [ ] no `bindsLane` dangles in either graph, and `lanes` is restored to
      bootstrap's roles if the answer allows it
- [ ] `v3se` is resolved or explicitly deferred with this decision as context

## x-ref — 2026-09-20: fixed / answered by the `bootstrap-workflows` declaration

`cat-harness/harness.json` now declares `bootstrap/workflows/` beside
`bootstrap/skills/`. That was the CAUSE — this file declared one of
bootstrap's two directories, and `kgDirectories` resolves the local
declaration only (root-only on purpose), so bootstrap's own declaration of its
processes was never read from here.

Measured: `workflowFiles(cat-harness)` 58 → 61, and the three bootstrap
diagrams became visible for the first time. What that immediately surfaced:

* `log-message.bpmn` had **no `BPMNDiagram` at all** — 0 shapes, 0 edges. A
  process that could not be drawn, undetected because nothing scanned it. DI
  authored; all three now render.
* The three got their **first-ever `kg:audit` sidecars**.
* `bootstrap/skills/roles/roles.json` carried a `_lanes_comment` saying
  `lanes` was omitted *because* the root declared `bootstrap/skills/` but not
  `bootstrap/workflows/`, producing three dangling links — and that **"whether
  the root should declare both halves of bootstrap or neither is bean
  `pve3`"**. Both halves are now declared, so the workaround is obsolete: the
  four roles are bound to their lanes and the export carries them with **0
  dangling `bindsLane` edges**, which is the falsifier that comment named.

Still open, as bean `58yc`: `kg-audit` reads roles from a hardcoded
`join(root, "skills")`, so it cannot see bootstrap's roles and reports four
`lane-binds-role` failures about a file it never opens. The bindings are
correct; the audit is blind. Deliberately not fixed inside this change.
