---
# folio-assistant-k3tw
title: 'GATE RED ON MAIN: docs/_data/translations.json is stale — the batch PRs add locale pages without regenerating the index'
status: completed
type: bug
priority: high
created_at: 2026-09-26T13:56:51Z
updated_at: 2026-09-26T14:36:43Z
parent: folio-assistant-bzyu
---

## What is red

`bun test cat-harness/content/pipeline/translation-index.test.ts`
→ `this repository's own corpus > the committed index is up to date and valid`

```
expect(r.state, `run: bun run translation:index`).toBe("ok")
Expected: "ok"   Received: "stale"
```

It runs inside the `TypeScript — tests, lint, types (hard)` job, so every open
PR's merged tree is red on it, on top of the `t8g3` drift.

## Provenance — established by control, not inference

Measured 2026-09-26, three trees:

| tree | result |
|---|---|
| `claude/sleepy-rubin-mr6kdu` @ `aed0d28afa1` (local checkout) | **31 pass, 0 fail** |
| same branch, `refs/pull/1403/merge` (CI) | **fail** |
| pristine `origin/main` @ `f850f721a06`, clean worktree | **fail** — 30 pass, 1 fail |

A clean worktree of pristine main fails it identically, so the failure arrives
with the base branch and is not any PR's. The branch that is red in CI passes
in its own checkout, which is exactly the merged-state signature.

## Cause

The translation batches publish locale pages; `docs/_data/translations.json` is
derived from them by `cat-harness/content/pipeline/translation-index.ts` and is
**committed**. The batch PRs add the pages and do not re-run the generator, so
the committed index falls behind the pages it indexes. `#1404`
(`claude/206-translate-batch4`) and `#1409` (`claude/206-translate-batch5`)
both landed in that shape.

## The available patch, and why it is not enough

On pristine main:

```
bun run translation:index
→ Wrote docs/_data/translations.json — 14 source page(s), locales: ar, es, fr, ru, zh
 M cat-harness/docs/_data/translations.json | 252 +++++++++++++++++++
```

One generated file, 252 insertions, no hand authoring. But regenerating it
**is not the fix**, it is the symptom cleared: batch6 puts it back. The gate
that is missing is the one that ties the index to the pages — either
`translation:index` in the batch recipe, or a `translation:index:check` a batch
PR cannot merge past.

Deliberately NOT applied on #1403: that PR is a two-file `gates.ts` change, the
252 lines belong to the translation sessions' live area, and a regeneration
committed there would conflict with the next batch rather than help it.

## Done when

- [ ] `translation:index` is re-run as part of whatever produces a batch, or a
      `:check` refuses a batch that leaves the index stale
- [ ] falsified by breaking: a locale page added without regenerating must make
      the new gate red
- [ ] `origin/main` passes `translation-index.test.ts` in a clean worktree


## Resolved on main, 2026-09-26 — and this bean named the wrong cause

`bun run translation:index:check` on `origin/main` at 016b9c0f46c:

    translation index up to date — 14 source page(s) with translations

A sibling session regenerated it (#1408, then #1414). Closed on EVIDENCE rather
than authorship — I did not write the fix.

### The correction, which is the part worth keeping

This bean said: *"The gate that is missing is the one that ties the index to the
pages — either `translation:index` in the batch recipe, or a
`translation:index:check` a batch PR cannot merge past."*

**That gate was not missing.** It exists and is registered:

    .github/workflows/code-quality-gates.yml:1469   run: bun run translation:index:check
    package.json:330                                "translation:index:check": "... --check"

I proposed building a thing that was already there, and I proposed it while
looking at its own failure output. The question I should have asked is not
"what gate is missing" but "why did a gate that exists not stop this".

### The real answer, and it is `gw8h`

`translation:index:check` sits well down the `Repository gates` job, and
`check:glossary` — step 12 of ~38 — was red. A job stops at its first failing
step, so **the index gate never ran**, on main or on any PR, for as long as the
glossary was stale. The batches merged past a gate that was never asked.

So these two beans are one story: `gw8h` did not merely fix six links, it
restored the ability of every later gate in that job to be heard. This bean is
what that silence cost, and it is unlikely to be the only one.

### What is NOT closed by this

Nothing prevents the index going stale again between a batch and its
regeneration; the gate catches it at CI, which is what a gate is for. The
recurrence risk is a process question about batch PRs, not a missing check, and
it is deliberately not reopened here under a wrong premise.
