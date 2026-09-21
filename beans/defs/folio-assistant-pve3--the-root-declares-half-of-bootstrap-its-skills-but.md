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

The root `harness.json` declares `bootstrap` → `cat-bootstrap/skills/`, so
folio-assistant's graph carries **bootstrap's skills and roles**. It does NOT
declare `cat-bootstrap/workflows/`, so it does not carry **bootstrap's process** —
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

`lanes` was omitted from `cat-bootstrap/skills/roles/roles.json` to keep the graph
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

## 2026-09-20 — the cost of "both" is now measured, and it is what blocks `7u3g`

This bean asked for a decision without numbers on one side of it. Here they are,
taken by adding `bootstrap/workflows/` to the root declaration
(repository-scoped, `dependents: skip`, mirroring the `bootstrap` entry) and
measuring before and after. **No code change was needed** — `workflowDirs`
already has a fallback written for exactly this directory.

**What "both halves" buys** — this is `7u3g`, filed independently today by a
sibling who did not know this bean existed:

| | before | after |
|---|---|---|
| `.bpmn` reachable from `workflowFiles` | 50 | 53 |
| of those, bootstrap's | 0 | 3 |
| `skill-in-role-or-process` FALSE findings | 3 of 100 | 0 of 97 |
| kg-qa sidecars for the three | 0 | 3 |
| `workflow_list` / `workflow_start` | blind | all three list and resolve |

Sixteen consumers are blind today, and the visible symptom is a false finding:
the audit reports `confirm-harness`, `discussion` and `log-message` as named by
no activity, when all three ARE named by `<folio:skill ref>` in diagrams it
cannot see. That is worse than a gap — a reader concludes three skills are
unreachable when the truth is that three diagrams are.

**What "both halves" costs**, measured the same way:

- References to bootstrap's processes in the root's exported
  `_kg/folio-assistant.jsonld`: **0 → 238**. `#432` removed 88; the number is
  larger now because bootstrap has grown a third process since.
- The suite fails on the test that guards it:
  *"a second instance in the tree stays out of the first's graph > the root
  instance's nodes include none of bootstrap's process"*.

The test was not touched and must not be. It is this decision, written down as
a gate, and it fired correctly.

**What "neither" would cost**, not measured because it was not built: bootstrap's
skills leave folio-assistant's published docs (which also resolves `v3se`, the
name collision), and the three diagrams stay unreachable from this root — but
*correctly* so, because the root would no longer claim any of bootstrap. They
would then need auditing from bootstrap's own instance, which is the
`nested-instance-audited` finding `kg:audit` already reports (2).

**The entry is written and held**, with its full rationale, in the commit
message of the `7u3g` work. Ruling either way is a one-line change from here:
"both" inserts it, "neither" removes the `bootstrap` entry beside it.


## ANSWERED IN PRACTICE, 2026-09-20 — by a sibling, and it is "neither"

A sibling session reached this independently and landed the answer on `main`:

    ec680daf57  Revert 907cad61b — the bootstrap declaration re-introduces
                the isolation leak
    b94141f6ce  Restore only the log-message DI

So the declaration was tried, the leak it causes was measured a second time by
somebody who did not know this bean existed, and it was REVERTED. That is
"neither" arrived at twice from two directions, which is stronger evidence than
either pass alone — and it matches what the guard test has been saying all along.

What the revert kept is the part that was never the decision: `log-message.bpmn`
had no diagram interchange, which is a defect whichever way this bean goes.

**This bean is not closed by that.** The revert settles "do not declare both
halves"; it does not settle the OTHER half. The root still carries
`bootstrap/skills/`, so the three dangling `bindsLane` links and the `v3se`
name collision are still live, and the three diagrams are still reachable from
no consumer. "Neither" means dropping the skills entry too, and nobody has done
that.

Remaining for the author: confirm that "neither" is the intent, which makes
`v3se` fall out for free and moves bootstrap's skills out of folio-assistant's
published docs.


## STILL LIVE, and the bean names the wrong file — corrected 2026-09-21

Attempted the third done-when (*restore `lanes` if the answer allows it*) on
the belief that the asymmetry had gone. **It has not.** The attempt was
reverted, and both halves of that are worth recording.

### The measurement that misled me, and why

This bean says *"the root `harness.json` declares bootstrap →
`cat-bootstrap/skills/`"*. I read the ROOT's `harness.json`, found **no**
`cat-bootstrap` directory in it — only an `assets` entry naming
`cat-bootstrap/AGENTS.md` as the `source` this checkout's own AGENTS.md
descends from — and concluded the asymmetry was gone and the root now carried
neither half.

**The declaration is in `cat-harness/harness.json`, not the root's:**

```
id= cat-bootstrap          path= cat-bootstrap/skills/   scope= repository
id= cat-bootstrap-render   path= cat-bootstrap/render/   scope= repository
```

`scope: "repository"` resolves against the REPOSITORY root rather than the
declaring instance, so the entry lands in folio-assistant's graph while living
in cat-harness's file. `cat-bootstrap/workflows/` has no such entry. The
asymmetry is exactly as this bean describes it; only the file is wrong.

**Corrected in the text above?** No — left as written, with this section as
the correction, because the original sentence is what a reader will grep for.

### The falsification, which is the useful half

Restoring `lanes` on all four roles produced **four** dangling `bindsLane`
edges in the root graph, one per role:

```
role/initiator                  bindsLane  role/Initiator
role/knowledge-graph-data-store bindsLane  role/Knowledge%20Graph%20Data%20Store
role/requestor                  bindsLane  role/Requestor
role/logger                     bindsLane  role/Logger
```

caught by `kg-export.test.ts` §*"internal links resolve, bar the known data
defects"*, which pins `danglingLinks.length <= 4` **and** that every dangling
edge is `declaresSkill` or `providesCapability`. Reverted; back to **0**.

Four rather than the three measured 2026-09-20 because this bean's note
predates `logger`, so a restoration today is worse than it was.

### A fifth lane exists and is deliberately unbound

`log-message.bpmn` has a lane named `Actor` that no role claims, and it should
stay that way: the point of that diagram is that the actor VARIES. The
`logger` role's own description says the skill belongs to whoever is DOING the
thing being logged, and `log-message` takes `actor` as a required input
precisely because the Logger cannot infer who acted. A role binding `Actor`
would assert the opposite. Worth stating so the next reader does not "fix" it.

### The decision is unchanged and is still the owner's

**Both halves, or neither.** Nothing an agent should pick: both re-carries a
process the root does not own into its published graph and undoes #432's
isolation; neither stops bootstrap's skills appearing in folio-assistant's
docs. What is now known is where the one-line change goes — the
`cat-bootstrap` entry in `cat-harness/harness.json`, plus a sibling entry for
`cat-bootstrap/workflows/` if the answer is *both*.
