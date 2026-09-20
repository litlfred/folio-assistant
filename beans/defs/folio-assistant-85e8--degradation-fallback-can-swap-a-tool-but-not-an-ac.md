---
# folio-assistant-85e8
title: 'DEGRADATION: fallback can swap a tool but not an ACTOR'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-20T03:12:36Z
updated_at: 2026-09-20T03:29:21Z
parent: folio-assistant-ahvw
---


**The crux of the signing thread.** Found 2026-09-20 while designing the
two-route signing process the owner asked for.

```ts
export interface SkillCapabilityRef {
  degradation: "fail" | "warn" | "skip" | "fallback";
  /** Alternative capability to use in fallback mode. */
  fallbackCapabilityId?: string;
}
```

**The fallback is always another CAPABILITY.** The model can express *use a
different tool*; it cannot express *use a different kind of participant*.

So the owner's case — "an API wouldnt wokr and a human actor is needed" — is
**unexpressible today**, and that is why the two parallel routes cannot be
drawn. This is a schema gap, not a missing diagram.

## What it needs

An actor-valued fallback beside the capability-valued one, naming the lane
that takes over. Then `folio-assistant-r0rq` can be drawn.

## The trap to avoid

Do NOT model "a human is available" as a capability to reuse the existing
field. A declared capability carries
`detection: { method: "command", command: "…" }` — it is a thing you PROBE
the environment for. A person is not probeable by a command, and bean
`folio-assistant-ind9` fixed exactly the error of putting non-probeable
things in `capabilities[]`. Putting one back undoes a completed fix.

## Done when

- [ ] a degradation can name an actor or role fallback, not only a capability
- [ ] `fallback-actor-resolves` checks the named lane exists in the process
      it is used in — otherwise the field is a second `blv9`, a
      reference-shaped value resolving to nothing
- [ ] both checks carry a vacuity guard: a check over a field nobody has
      populated passes trivially, which this repository has paid for three
      times

## Shipped 2026-09-20 — `fallbackRole`, with the check that keeps it honest

Owner: *"2y and that is QA report"*.

`SkillCapabilityRef.fallbackRole?: string` beside `fallbackCapabilityId`,
in both declarations (`schemas/assistant-types.ts`,
`schemas/skill-package.ts`). A **role**, not an actor id: a role is the
swimlane a process can route to, and naming a concrete actor would bind a
skill to one participant — the `role-model.md` rule that nothing IS a
reviewer, somebody ACTS AS one for a lane.

`bun run check:fallback-roles` resolves every use against the role
registry, read through `kgRoots()` + `readRoleGraph()` rather than a
literal path. Wired into `code-quality-gates.yml`, so `bun run gates`
picked it up on its own: **37 → 38**.

## What was measured before extending it, and it matters

The degradation model is **declared and documented but not enforced at
runtime**:

| | |
|---|---|
| skill modules declaring `requiredCapabilities` | 24 |
| degradation values in use | 23 — `fail` 17, `fallback` 5, `warn` 1 |
| runtime consumer acting on it | **none** |
| only reader | `scripts/generate-docs.ts`, which RENDERS it |

So this field is a DECLARATION. The thing that executes a two-route
process today is a **BPMN gateway** — which is where `r0rq` puts the
branch. Both are needed and they do different jobs; saying only the first
would overstate what shipped.

## The vacuity guard, because the field starts unused

`check:fallback-roles` **states that it examined nothing** rather than
printing a tick, and `--require-use` turns that into a failure for the day
somebody wants to assert the mechanism is exercised. A check over a field
nobody has populated passes trivially, and that is not the same as
passing — paid for three times here (a grep over zero Lean files printing
OK, a ruff scan of missing paths, `readme:sync:check` over a marker-less
README).

## Two defects the repo's own gates caught

- `check:declared-paths` refused my hardcoded `"skills"` in the roles path
  and named the remedy. The declaration is read now, so relocating the
  `kg` directory cannot silently make this check examine nothing.
- The import was wrong (`kgRoots` is in `scripts/known-skills.ts`, not
  `schemas/cat-harness.ts`) — which also broke `bun test`, since a test
  imports the module. One cause, two symptoms.

8 tests. 3012 pass / 0 fail across 214 files; 38 gates.

## Done when

- [x] a degradation can name a role fallback, not only a capability
- [x] `check:fallback-roles` resolves it, and is in CI
- [x] vacuity guard, with `--require-use` for the stricter day
- [ ] first real use lands with `folio-assistant-r0rq` (signing)
