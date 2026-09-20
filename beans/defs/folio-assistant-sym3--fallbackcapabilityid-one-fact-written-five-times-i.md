---
# folio-assistant-sym3
title: 'fallbackCapabilityId: one fact written five times — it belongs on the capability'
status: todo
type: task
created_at: 2026-09-20T09:53:30Z
updated_at: 2026-09-20T09:53:30Z
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
