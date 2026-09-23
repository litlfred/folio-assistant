---
# folio-assistant-zkgs
title: findContentRepoRoot() stops at cat-harness/, so this repo's harness.config.json is never read
status: completed
type: task
priority: normal
created_at: 2026-09-20T13:54:01Z
updated_at: 2026-09-23T14:52:07Z
parent: folio-assistant-1swy
---


## What was measured

Found while fencing `detangler-archimedean-wall` behind `folioOptionalAxes()`.
The fence verified OFF immediately and could not be verified ON from anywhere
in this checkout, whatever the cwd. Every number below was observed.

`findContentRepoRoot()` walks up from `process.cwd()` and stops at the nearest
ancestor holding the declared folio directory. `cat-harness/harness.json`
declares one — `folio/`, the instance's own landing content — so the walk stops
at `cat-harness/`. This repository's `harness.config.json` sits one level up, at
the repository root. The two never meet:

```
cwd anywhere in the repo
  findContentRepoRoot()                -> /home/user/folio-assistant/cat-harness
  resolveHarnessConfigPath(that)       -> undefined
  readDeclaredFolioProfile(that)       -> { declaredBy: "undetermined (no harness.config.json)" }
  readDeclaredFolioProfile(repo root)  -> { profile: "document", declaredBy: 'harness.config.json contentType: "document"' }
```

Neither half is individually wrong. The declaration is correct — `cat-harness/folio/`
really is this instance's authored content. The config is correct where it is —
`src/index.ts` reads it to pick the MCP adapter for the whole checkout. The
split put them at two different roots and nothing noticed, because the resolver
answers with a plausible path rather than a fault.

## Why it matters, in this repository's own words

`harness.config.json`'s leading comment states the consequence exactly:

> "Declaring it is what makes QA criterion scoping work on this repo's own
> content; without it `readDeclaredFolioProfile()` returns undefined, the third
> state runs every criterion, and the paper adapter's LaTeX-shaped axes fire
> `critical` on prose that never reaches pdflatex."

That is the state the repository is in. The evidence is committed: sidecars
under `test/results/block-qa/content/docs/publication-workflow/` carry
`detangler-archimedean-wall` verdicts — a `profiles: ["paper"]` criterion —
scored against workflow documentation. Every other paper-profile criterion is
in the same position.

Second consequence: `folioOptionalAxes()` reads the same config, so **no
optional axis can be opted into from this repository at all.** `q-usage` has
been fenced this way for some time and its fence has never been openable here
either. A mechanism that can only ever answer one way is bean `xom7`'s shape:
the OFF state and the BROKEN state are indistinguishable from the outside.

## Done when

The config and the resolver agree, and something fails if they stop agreeing.
Three candidate fixes, NOT yet chosen — each changes what every pipeline
consumer sees, which is why this is a bean rather than a patch:

- **A.** Move `harness.config.json` into `cat-harness/`. Smallest diff.
  Wrong-looking: `src/index.ts` reads it to configure a checkout, and the
  platform's document corpus is `content/` at the repository root, not under
  `cat-harness/`.
- **B.** Keep walking up past a matched folio directory when no
  `harness.config.json` is found there. Fixes the symptom; makes the resolver
  answer two different questions ("where is the content" and "where is the
  config") with one walk, which is how it acquired the defect.
- **C.** Resolve the config root separately from the content root, and make the
  config root declaration-driven like everything else. Largest, and the only one
  that ends with a fact written down once.

Whichever: the gate is that `readDeclaredFolioProfile()` on this repository
returns `document` rather than the third state, and that a test fails if it
regresses. Re-sweeping the affected sidecars afterwards is part of the change —
the paper-profile verdicts on document prose are stale results, not findings.

## Not in scope here

Fixing it inside the fencing change. The fence was verified against a synthetic
folio root instead (`scripts/tests/folio-optional-axes.test.ts`, subprocess,
OFF 8 detangler criteria / ON 9), and the finding was recorded rather than
acted on — which is `graph-detanglement`'s own residue rule applied to the
session that found it.

## RULED, owner, 2026-09-20 — and it is none of A/B/C

> "mv to root at `cat-harness.config.json` as will all instantiated instances
> (not just materialized KGs). `root/` is where instantiation is tracked.
> check siblings. coordinate"

So the file **stays at the repository root** and takes the instance's name.
Neither the content root nor a per-instance subdirectory: the root is the
**instantiation registry**, and each instantiated instance is tracked there by
its own `<instance>.config.json`.

That reframes the defect. I had it as "the config is in the wrong place". It is
not — `findContentRepoRoot()` is simply the wrong resolver to reach it with.
**Two different roots, and they were never the same question:**

| question | root |
|---|---|
| where is the folio's content | the nearest declared folio directory — `findContentRepoRoot()` |
| where is this instance instantiated | the checkout root, holding `<instance>.config.json` |

Option A would have moved the file to the content root and locked the two
together permanently; B answers both with one walk, which is how the defect
arose; C is the right shape but the ruling names the naming convention C left
unspecified. **The ruling is C with its filename decided**, so C is what gets
built.

It also settles the question the owner raised earlier in the session and left
hanging — *"`harness.config.json` --> `cat-harness.config.json`, no?"* — as a
decision rather than a musing, and generalises it: not a rename of one file but
a **convention**, `<declared instance name>.config.json`, at the root.

## Coordination — checked, and one dependency found

Surveyed the eight open PRs for collisions on this work (2026-09-20). Only
**#477** touches any of it, and what it touches is the premise:

```
cat-harness/schemas/harness-config.test.ts
-      expect(dir!.declaredBy).toBe("folio-assistant");
+      expect(dir!.declaredBy).toBe("cat-harness");
```

**The instance rename to `cat-harness` is already in flight there.** So
`cat-harness.config.json` is not a new name to invent — it is the name the
declaration will already be carrying. This bean's work should land **after**
#477, or it renames the file to match a declared name that has not landed yet.

#477 also imports `../../folio-assistant-core/schemas/library-ref.js`, a sibling
instance directory not in this checkout, which is more of the same split
arriving. Nothing else among #525, #526, #530, #531 touches `harness-config.ts`,
`voices.ts` or the filename.

## Done when

- The config filename is **derived from the declaration's `name`**, not a
  constant: `<name>.config.json` at the instantiation root. A constant is what
  made `HARNESS_CONFIG` a single global name in the first place, and the whole
  point of the ruling is that there is one per instance.
- A **separate resolver** for the instantiation root, distinct from
  `findContentRepoRoot()`. The two answer different questions and one walk
  answering both is the defect.
- `readDeclaredFolioProfile()` on this repository returns `document` rather than
  the third state, and a test fails if it regresses.
- The affected `test/results/block-qa/` sidecars are re-swept: paper-profile
  verdicts on document prose are STALE RESULTS, not findings.
- `9ici` lands too, or the old name keeps half-working through `voices.ts`.

## Not in scope

Migrating downstream folios. qou is pinned at `df28d02` (2026-09-07) and cannot
see any of this until its pin is bumped — see `5xfr`, which carries the recipe
and must be updated with THIS name once it lands.

## x-ref — `b5f0`, 2026-09-20: the ruling predates a question it does not answer

The ruling here is on **`harness.config.json`** (the CONFIG). The owner restated
it later the same day as *"`cat-harness.config.json` as an **instance
declaration** in root"* — and the declaration is `harness.json`, a **different
file** (`schemas/cat-harness.ts`: directories, graphs, dependents, assets,
stickies).

So the convention `<name>.config.json` is settled; **whether it replaces
`harness.json` or sits beside it is not.** Both answers have a cost, recorded in
`b5f0` §1: merging undoes a separation qou needed both halves of on this very
day, and keeping them separate leaves the `.config`-suffixed file as the config
and the unsuffixed one as the declaration, with neither name saying so.

Do not start the rename without settling that. `b5f0` carries it as an owner item.

---

*2026-09-21, session_01AYHimvYMmf8h8e9fFN6dW5 — **this bean's Done-when is
written against the reading the owner did not take.***

The Done-when here assumes a *config* file **beside** the declaration, with a
separate resolver for the instantiation root. The owner ruled **REPLACE** on
`b5f0`: one file per instantiation root, `<name>.config.json` absorbing
`harness.json`. Reconfirmed 2026-09-21 and widened to `bootstrap/` and the
`folio-assistant-*` instances.

The separate-resolver half of this bean survives the ruling — `findContentRepoRoot()`
answers a different question either way. The two-files half does not.

**Not edited here** — a sibling's bean. `b5f0` carries the ruling, the measured
migration cost, and the ordering constraint that the 21 literals bypassing
`DECLARATION_FILENAME` are routed through it first, as a change that is correct
under either filename.

## Re-measured 2026-09-23 — the symptom was already fixed; the regression test was not

Measured from three working directories (repo root, `cat-harness/`, `cat-harness/content/pipeline`):

- `findContentRepoRoot()` → `cat-harness/` (unchanged) — but `resolveHarnessConfigPath` now walks OUTWARD from the instance root and finds `cat-harness.config.json` at the repository root. The fix arrived incidentally, with per-instance config names (`<instance>.config.json`; `harness.config.json` no longer exists).
- `readDeclaredFolioProfile(root)` → `document`, declared by `cat-harness.config.json` — not the third state.
- `folioOptionalAxes()` reads `expectedInstanceConfigPath(root)` = the same existing file; `[]` because no `qaAxes` is declared, which is a legitimate answer now rather than an unreachable one.
- The 122 committed sidecars carrying `detangler-archimedean-wall` all record `n/a` ("criterion applies to the paper profile; this folio is document") — correctly scoped; nothing to re-sweep.

What remained was the bean's own gate — "something fails if they stop agreeing". No test ran the REAL resolution on the REAL repository; the existing ones use fixtures, which is how the original defect survived.

## Summary of Changes

- New `cat-harness/scripts/tests/repo-config-agreement.test.ts`: on this repository, the content root resolves to a config that exists, the declared profile is `document` (never the third state), and the optional-axes reader points at that same existing file. Falsified: moving `cat-harness.config.json` aside fails all three.
- No resolver change: fixes A/B/C were overtaken by the per-instance config naming.
