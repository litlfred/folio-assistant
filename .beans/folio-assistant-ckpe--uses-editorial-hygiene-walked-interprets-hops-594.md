---
# folio-assistant-ckpe
title: uses-editorial-hygiene walked interprets hops; 594 of 594 redundancy reports were wrong
status: in-progress
type: task
priority: normal
created_at: 2026-08-24T20:27:21Z
updated_at: 2026-08-30T07:30:49Z
---

## The ruling that settles it

> *does sending a reader to a REMARK ABOUT B mean they have read B's
> prerequisites? no — it means that the reader can take for granted assertions
> made, but if they need more info they can look at referenced content.*
> — owner, 2026-08-24

So an `interprets` edge transmits **nothing forward** for this purpose. A
`uses[]` entry reachable only through one is **not** redundant: the reader
still needs it named directly, because passing through the remark never
obliged them to read it.

## What the checker was doing instead

`checkUsesEditorialHygiene` walked `g.cone(other, "editorial")` — the union of
`uses` and `interprets`. So it called an entry redundant whenever ANY editorial
path reached it, including paths that leave a block by its `interprets` edge
and therefore carry no prerequisite at all.

**This was a regression, not a design choice.** Bean `folio-assistant-r0ax`
(2026-08-07) specifies the criterion as *"transitive redundancy (A uses B, B
uses C, A uses C)"* — `uses`, three times. `cone(other, "editorial")` MEANT
`uses` when it was written. Bean `i8ad` (2026-08-15) made `interprets` an
editorial edge, correctly and for good reasons, and silently widened this
criterion as a side effect.

## The measurement

Over qou 2026-08-24, before the fix:

| | |
|---|---|
| blocks warning | **374** |
| redundancy reports | **594** |
| of those reachable through `uses` | **0** |
| of those `interprets`-only | **594** (100 %) |

And every one of the 594 named `prune-transitive-deps.ts` as the remedy. That
tool computes the transitive reduction of `uses[]` alone — so it would have
reported nothing and changed nothing for any of them. A remedy that no-ops on
100 % of the findings it is offered for is worse than naming none: it reads as
"someone should run the script" rather than "this finding is wrong".

r0ax recorded 339 warns on 2026-08-07, when the cone still meant `uses`. Those
were genuine, and the corpus now has **0** uses-only redundancies — they were
pruned. Every warn since has been noise.

## Fix

`cone(other, "uses")`, restoring the specified behaviour. Cycle detection is
deliberately NOT touched: `detangler-no-dependency-cycle` walks the full
editorial relation and should, because "read A before B and B before A" is
circular whichever field carries the leg. Ordering is a different question from
prerequisite transmission, and only the latter is what redundancy depends on.

Two corpus-wide invariant tests, asserted generically with no label hardcoded:
a warn fires iff a uses-only redundancy exists, and an `interprets`-only path
is silent. Over qou: **0 blocks warn, 374 interprets-only paths correctly
silent**, 3,931 assertions. Suite 724 pass / 0 fail; eslint clean.

## Sidecars

361 qou sidecars recorded a current `uses-editorial-hygiene: warn` that the
checker no longer produces. Re-swept — see the qou commit for the flip
analysis and anything the re-run surfaced.

## How this was found

Not by looking for it. `prop:centered-hecke-variance-positive` carried one warn
among the four hidden findings of qou bean `qou-h1p7`; chasing that single warn
to its named remedy found the remedy reported nothing, and asking why produced
the 594.


2026-08-30 — on branch `claude/stalled-prs-scope-map-ufyvla`, PR #151 (open).

The fix landed as `cone(other, "uses")`, which does not type-check: `EdgeKind`
is `"editorial" | "formal"` (provenance), and `uses`/`interprets` is a
different axis carried per-edge in `editorialField`. `bun test` runs the
transpiled code and does not type-check, so the suite and eslint were both
green over an expression that does not compile; PR 151's hard TypeScript gate
caught it. Same defect shape as the criterion itself: an absent check looks
exactly like a passing one.

Replaced with `ContentGraph.usesCone(label)` — a cycle-safe transitive cone
over editorial edges whose `editorialField` is `uses`. Semantics unchanged, so
the 594/594 measurement stands. `EdgeKind` deliberately NOT widened: adding
`"uses"` would make `kind === "editorial"` stop meaning every editorial edge
and silently change `cone`/`out`/`in`/`outEdges` for existing callers.

Now verified on all four gates, not two: tsc --noEmit clean, bun test
1214/38/0, eslint clean, generated docs no diff.
