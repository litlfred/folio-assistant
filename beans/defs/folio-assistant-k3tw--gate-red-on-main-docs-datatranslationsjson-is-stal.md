---
# folio-assistant-k3tw
title: 'GATE RED ON MAIN: docs/_data/translations.json is stale — the batch PRs add locale pages without regenerating the index'
status: todo
type: bug
priority: high
created_at: 2026-09-26T13:56:51Z
updated_at: 2026-09-26T13:56:51Z
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
