---
# folio-assistant-77ex
title: AGENTS.md makes claims ABOUT CODE that nothing checks
status: completed
type: task
priority: normal
created_at: 2026-09-20T03:05:22Z
updated_at: 2026-09-20T12:29:02Z
parent: folio-assistant-1xhc
---

## The gap

Two checks already cover `AGENTS.md` and neither covers this:

- `check:agents-xref` — citations **into** it resolve (a skill naming a section).
- `check:declared-assets` — links **out** of it resolve (bean `v8gh`).

Neither looks at what the prose ASSERTS about code. Measured 2026-09-20, two
claims had gone false with nothing noticing:

1. *"`resolveSkillDirs` … has **no caller** — so today skill discovery is
   root-only in practice, and a dependency's skills are not yet reachable."*
   It has had a caller since 2026-09-19 (`src/tools/skill-fetch.ts`), and a
   dependency's packages are served.
2. *"This repo is pre-split and declares `schemas/` and `skills/` only."*
   Neither half was true; `harness.json` carries many more entries.

The first is the costly one. A **stale gap notice is worse than none**: an
agent that believes it either avoids the working feature or reimplements it.

## Why the obvious guard is the wrong one

String-matching the prose — "fail if AGENTS.md says `no caller` about a
function that has one" — is a proxy over language, and this session already
paid for one of those: three tests went red on a documentation comment because
they grepped source text rather than code, and the repair was
`codeWithoutComments`. A checker that greps English will cry wolf and be
switched off.

## What might actually work

The claims that went stale both **named a symbol or a path**. A check in the
shape of `check:declared-paths` — every `` `identifier` `` that AGENTS.md
attributes to a named module resolves to an export of that module — would have
caught the first and says nothing about prose it cannot parse. Unresolvable
mentions would need the same `declared-path-literal:`-style escape hatch, with
a stated reason.

That is a real design, not a small one, and it is why this is a bean rather
than part of the fix.

## What the falsification changed about the design

Done-when #3 was run FIRST, and it revised the bean. At `08f43c55b2` the file
said `resolveSkillDirs` was *in* `schemas/folio-config.ts` — and **that module
existed at that commit and did declare the symbol** (`git show`). The LOCATION
claim was TRUE. Only *"has no caller"* was false.

**So the design this bean proposed would not have caught this bean's own
motivating example.** `check:agents-claims` therefore carries two shapes:

| shape | catches |
|---|---|
| **location** — `` `symbol` `` in `` `module` `` | a symbol renamed or a module moved |
| **absence** — one backticked symbol + "has no caller" / "nothing calls it" / "not yet reachable" / "is never called" | example #1, which location misses |

The absence half needs two exclusions, both visible in the historical case: of
four files referencing `resolveSkillDirs`, one was its **declaration** and one
its **test**. Counting either as a caller would turn a true gap notice into a
false finding — and a false finding on the file every agent reads first is how
a checker gets switched off. It was false because of the third,
`src/tools/skill-fetch.ts`. Both exclusions are pinned by tests.

Example #2 — *"declares `schemas/` and `skills/` only"* — is a claim about a
**config file's contents** and is caught by neither shape. The CLI SAYS SO on
every clean run rather than dropping it, so the green is not read as wider
than it is.

## Done when

- [x] a claim naming `symbol` in `module` is checked to resolve, or carries a
      declared reason — `locationClaims` + `resolveModule` + `declares`;
      `BASES` resolves a cited path against the roots it may be written from
- [x] the check reports **could-not-parse** as its own state rather than as a
      pass — every claim must carry a backticked symbol and a recognised
      shape; anything else is not parsed and not counted as verified, and
      **zero parsed claims exits 2**, not 0 ("0 checked, 0 false" over this
      file reads exactly like a pass)
- [x] falsified against the two real claims above, restored from git history —
      example #1 is a test asserting BOTH halves fire separately; example #2 is
      out of shape for either, and is named in the report rather than dropped

## Shipped

`cat-harness/scripts/check-agents-claims.ts`, registered as
`check:agents-claims` and run by `code-quality-gates.yml` in the same change
(the unrun-script ratchet, bean `ot9a`, fails a script no workflow runs).
Classified `harness` in `repo-partition.ts`: it imports `schemas/cat-harness.js`
and nothing else, so unlike its neighbour `check-agent-entry-links.ts` it
inherits no wrong-direction edge from the generic link auditor (bean `cp3l`).

**Gating from the first commit** — zero findings on the current file: 6
location claims, 0 absence, all hold. 22 tests. `bun run gates` green.
