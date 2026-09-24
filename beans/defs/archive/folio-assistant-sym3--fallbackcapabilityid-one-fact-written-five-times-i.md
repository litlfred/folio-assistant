---
# folio-assistant-sym3
title: 'fallbackCapabilityId: one fact written five times — it belongs on the capability'
status: completed
type: task
priority: normal
created_at: 2026-09-20T09:53:30Z
updated_at: 2026-09-20T10:32:19Z
parent: folio-assistant-ahvw
---

Found 2026-09-20 while excising `fallbackRole` (`85e8`), under the owner's
standing objection: *"i dont like duplicate data maintenace issues"*.

## The duplication

One fact — **`lean-toolchain` degrades to `lean-mcp`** — written in five
skill modules:

| module |
|---|
| `folio-paper-adapter/formalizer.ts` |
| `folio-paper-adapter/proof-simplifier.ts` |
| `folio-paper-adapter/lean-generation.ts` |
| `folio-paper-adapter/lean-proof-review.ts` |
| `folio-paper-adapter/category-theory.ts` |

Every one identical:
`{ capabilityId: "lean-toolchain", degradation: "fallback", fallbackCapabilityId: "lean-mcp" }`.
It is 5 of the 6 `fallback` uses in the repository, and 100 % of the
`fallbackCapabilityId` uses.

## Why this is different from `fallbackRole`

`fallbackRole` was **derivable** — the BPMN carried it executably, so the
declaration was a cache. This is not: no diagram says which capability
substitutes for which, and nothing else could. So the fact has to be
declared *somewhere*.

The question is **where**, and the answer is not "on each skill". *What
`lean-toolchain` degrades to* is a property of **`lean-toolchain`**, not of
the five skills that happen to need it. A sixth Lean skill has to remember
to repeat it; a change of substitute has to be made five times and can be
made four.

## The proposed shape

`.claude/skills/capabilities/lean-toolchain.json` grows a `fallbackTo`
naming another declared capability, and the skill modules drop
`fallbackCapabilityId` — keeping `degradation: "fallback"`, which is the
skill's own business (*what do I do when this is missing*) as against the
capability's (*what stands in for me*).

`check:fallback-roles` already resolves `fallbackCapabilityId` against the
declared capabilities, so it grows a third branch rather than a new check.

## What to check before doing it

- **Is the substitution really capability-global?** Measured: all five
  agree today. One dissenting skill would mean the per-skill override has
  to survive, and then the capability-level default is the base with the
  skill field as the exception — a different design from removing it.
- **Does anything read `fallbackCapabilityId`?** Expected: nothing, same as
  `degradation`. Worth re-probing properly rather than assuming — that
  assumption was wrong twice on `qif9`.
- **Cycles.** `fallbackTo` between capabilities is a graph and can loop;
  `CapabilityDefinition.requires` already has this shape, so reuse
  whatever guards it.

## Done when

- [ ] the capability-global question answered by measurement, not assumed
- [ ] `fallbackTo` on the capability, declared once, with a cycle guard
- [ ] the five modules drop the field; `degradation: "fallback"` stays
- [ ] `check:fallback-roles` resolves through the capability

---

## 2026-09-20 — done, and the measurement found something bigger than the duplication

Owner: *"1"*. De-duplicated as planned — and the open question this bean
asked first ("is the substitution really capability-global?") turned up a
defect that makes the answer almost beside the point.

### The duplication, removed

`CapabilityDefinition.fallbackTo` on `lean-toolchain.json`, declared once.
The five `folio-paper-adapter` modules drop `fallbackCapabilityId`;
`SkillCapabilityRef` loses the field entirely, since all five agreed and
no per-skill override survived the measurement. `degradation` stays on the
skill — *what I do when this is missing* is the skill's business, *what
stands in for me* is the capability's.

### The defect: this fallback CAN NEVER FIRE

`lean-mcp.json` declares `requires: ["lean-toolchain"]`, and
`probeAll` in `src/tools/capabilities.ts` computes

```ts
const requiresMet = (c.requires ?? []).every((r) => resolve(r));
const ok = requiresMet && probe(c, env);
```

So when `lean-toolchain` is absent, `lean-mcp` is absent too. The
declaration says *"when `lean-toolchain` is missing, use `lean-mcp`"* and
`lean-mcp` is **guaranteed missing in exactly that case**.

Five skills carried this. Moving it to one place did not fix it — but it
did turn five copies of a wrong fact into one, so whichever way it is
resolved is now a single edit.

### Which side is wrong — NOT decided here

Two readings, and I am not choosing between them:

1. **`lean-mcp.requires` is wrong.** Its `detection` is an `mcp-probe`
   against an endpoint with a `healthPath` — a *service*. A remote Lean is
   the whole point of falling back to it, and requiring a local toolchain
   makes the probe fail on any machine without one even when the server is
   reachable. **The likelier reading**, and it would make the fallback
   correct as written.
2. **The fallback is wrong.** If `lean-mcp` genuinely needs a local Lean,
   it is not a substitute for it, and the five skills should say
   `degradation: "fail"` or `"warn"`.

The evidence favours 1, but "favours" is not "establishes", and this is the
third field in a day where acting on inference would have been wrong.

### Reported, not gated — and the precedent is this repo's own

`check:fallback-roles` now walks `requires` transitively and reports a
substitute that needs the thing it replaces. It **does not fail** on it,
which is `check:agents-xref`'s pattern: *"had a backlog and rightly
reported before it gated"*. Gating today would redden CI on a contradiction
whose correct side is undecided.

The report is keyed by the **capability pair**, not the skill: five Lean
skills share one broken fallback, and printing it five times would report a
count of 5 for a defect of 1 — the "a count is a claim, not evidence"
failure this repository keeps naming. The skills are listed as blast radius.

```
⚠ 1 fallback(s) can never fire — the substitute needs the missing thing (5 skill(s) affected):
  · lean-toolchain → lean-mcp, but lean-mcp requires lean-toolchain
      reached by: category-theory, formalizer, lean-generation, lean-proof-review, proof-simplifier
```

A test asserts the defect **deliberately**, with a note that it must be
inverted rather than deleted when fixed — otherwise the finding vanishes
with no record it was ever real.

### Also carried

- `fallbackToCapability` declared in the JSON-LD context as a LINK (the
  value is a capability id and every Capability is a node, so it resolves),
  mapped in `registryFields`, and glossed in `schemas/vocabulary.ts`.
  Renamed on the way out like `requires` → `requiresCapability`:
  `fallbackTo` is a fine field name and an ambiguous shared-vocabulary term.
- A stale row missed in `85e8`: the degradation table still read
  *"Use `fallbackCapabilityId`, or `fallbackRole`"*, naming two fields that
  no longer exist.

### Done when

- [x] capability-global question answered **by measurement** — all five
      agreed, so no per-skill override survives
- [x] `fallbackTo` on the capability, declared once, with a cycle-safe
      transitive guard
- [x] the five modules drop the field; `degradation: "fallback"` stays
- [x] `check:fallback-roles` resolves through the capability
- [ ] **the contradiction resolved** — which side is wrong, `lean-mcp`'s
      `requires` or the fallback itself. Then gate the check and invert the
      test.

---

## 2026-09-20 — contradiction resolved, check GATED, test inverted

Owner: *"a1"* — `lean-mcp.requires` was the wrong side.

`requires: ["lean-toolchain"]` is gone from `lean-mcp.json`. Its Lean runs
**server-side** and its detection is an `mcp-probe` against an endpoint, so
requiring a local toolchain made it unavailable on any machine without one
even when the server was reachable — and, because `lean-toolchain.fallbackTo`
names it, made that fallback unable to fire at all. The reason is recorded in
the capability's own `description`, since JSON carries no comments.

**The check now gates.** It shipped reporting-only for a few hours on
`check:agents-xref`'s precedent, because the finding was sound while the
correct side was undecided. The backlog is empty, so it fails now — and an
empty backlog is the whole reason it can: a check that fails on the day it
lands teaches people to ignore it.

**The test is inverted, not deleted**, as this bean said it must be. Deleting
it would leave no evidence the finding was ever real, and the next person to
re-add that `requires` would get a green suite and a dead fallback. Two
guards came with it: a general assertion over **every** capability with a
`fallbackTo`, so a new one cannot reintroduce the shape; and a
non-vacuity test on a constructed chain, because with the corpus clean every
real assertion expects `false` and a predicate that always returned `false`
would satisfy them all.

### Done when

- [x] capability-global question answered by measurement
- [x] `fallbackTo` on the capability, declared once, cycle-safe
- [x] the five modules drop the field
- [x] `check:fallback-roles` resolves through the capability
- [x] **contradiction resolved**, check gated, test inverted
