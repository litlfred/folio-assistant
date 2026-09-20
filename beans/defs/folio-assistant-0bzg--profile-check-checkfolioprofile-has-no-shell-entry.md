---
# folio-assistant-0bzg
title: 'PROFILE CHECK: checkFolioProfile has no shell entry point — three options, none chosen'
status: todo
type: task
priority: normal
created_at: 2026-09-20T10:45:46Z
updated_at: 2026-09-20T11:56:01Z
parent: folio-assistant-d308
---


Found 2026-09-20 while authoring the `9x17` Tool node. **Not caused by that work**
— it is the state `profile-check.ts` has always been in, and authoring a node over
the group is what made it legible.

## The measurement

`cat-harness/content/pipeline/profile-check.ts` has **no `import.meta.main`**.

| export | non-test callers | reachable from a shell? |
|---|--:|---|
| `readDeclaredFolioProfile` | 4 | yes — `validate.ts`, `qa-sweep.ts` |
| `checkFolioProfile` — the CONFORMANCE check | 1 | **no** |
| `formatProfileCheck` | 1 | no |
| `readFolioProfile` | **0** | no caller at all |

The single caller of the conformance check is
`cat-harness/adapters/document/tools/validate.ts`, which registers MCP tools and
has no `import.meta.main` either. So the check runs only inside an MCP session.

## Why that is a finding rather than a preference

`content-profiles` is explicit that this check catches what schema validation
**structurally cannot** — a block valid against its schema but wrong for its
content profile, because adapters partition disjointly while profiles nest. It is
the second of two checks for a reason.

And `schemas/tool.ts` refuses the obvious shortcut of giving it a Tool node as it
stands: *"A Tool reachable only over MCP is not usable by the harness that defines
it, and projecting it would emit a server that proxies itself."*

**This is the third case `covered-is-not-reachable` names and had no example
of — a mechanism with no command at all.** The other three instances were skills
covered by Tools that did not perform their central act. This is the shape
underneath them, and it is invisible to `tools:coverage` by construction.

`readFolioProfile` having **zero** non-test callers is a separate, smaller
question in the same file: dead export, or the entry point somebody started and
did not finish?

## Options, with what each costs

1. **A `check:profile` script**, wired like `check:corpus-gate`. Cheapest, and it
   puts the check where every other gate is — but the platform carries no folio,
   so it would sit in `SCRIPT_EXEMPTIONS` as `no-folio` and never run here, which
   is honest but means the entry point is added and still unexercised.
2. **A `qa-sweep` axis.** The check is per-block and `qa-sweep` already writes
   per-block sidecars, so a verdict would be committed beside its subject and get
   the "never checked" / "checked and clean" distinction for free. Costs more: an
   axis is a registered criterion, not a script.
3. **Leave it MCP-only, and say so.** Defensible on one argument: a profile
   judgement is made while authoring, and an authoring session is exactly where
   MCP reaches. The cost is that nothing outside a session can ever ask the
   question, so CI cannot.

**Recommendation: option 2.** The check's shape already matches what `qa-sweep`
does — per block, verdict worth keeping, and the third state mattering — and it is
the only option where the answer becomes durable rather than printed. Option 1
adds an entry point that this repository can never run; option 3 keeps a
structural gap that `content-profiles` says matters.

**Not decided here.** Choosing is a change to the pipeline's public surface and
belongs with the owner, which is why this is a bean rather than a commit.

## If nothing is decided

Status quo: the conformance check keeps working inside MCP sessions and stays
unreachable from CI. Nothing regresses; the gap simply stays, now written down.

## Done when

- [ ] one of the three chosen, by a person
- [ ] whichever is chosen, `covered-is-not-reachable` gains this as its worked
      example of the no-command case
- [ ] `readFolioProfile` either gains a caller or is recorded as dead



---

## DECIDED 2026-09-20 — a `qa-sweep` axis

Owner chose **option 2, the `qa-sweep` axis**, and then clarified across the whole
set: **"all for triggers or tools as appropriate"**.

So the axis is the trigger, and the question of whether `checkFolioProfile` also
deserves a Tool node is answered by the same principle rather than by this bean's
original either/or: if a caller should be able to invoke it by name, that is a
Tool; the sweep firing it per block is a trigger. Both may exist.

What the axis must carry, from this bean's own argument: the profile check catches
what schema validation STRUCTURALLY cannot, so its verdict is not a refinement of
the schema verdict and must not be folded into it.
