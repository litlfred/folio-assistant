---
# folio-assistant-eqxp
title: 'MERGE FRICTION, one week on: the top churners have changed and four more pass 1swy''s test'
status: todo
type: task
priority: normal
created_at: 2026-09-30T23:35:24Z
updated_at: 2026-09-30T23:35:58Z
parent: folio-assistant-1swy
---

Follow-on to `1swy` / `oxka`, which added the first `.gitattributes` and, more
importantly, the TEST for what may go in it. Nothing here revises that test —
it applies it to a corpus that has moved.

## Why re-measure at all

`oxka` measured over three days ending 2026-09-24 and marked the three files it
found. Measured again 2026-09-30 over `origin/main`'s last 200 commits, **the
top of the table is no longer those three**:

| commits | path | marked by `oxka`? |
|---|---|---|
| 29 | `cat-harness/test/results/lsi/cat-harness/skills.lsi.json` | no |
| 26 | `cat-harness/test/results/skill-register.qa-results.json` | no |
| 21 | `beans/README.md` | no |
| 17 | `cat-harness/docs/glossary/index.md` | **yes** |
| 17 | `cat-harness/docs/_data/harness.json` | no |
| 15 | `cat-harness/docs/lsi/index.md` | no |
| 11 | `cat-harness/test/results/audit-coverage.qa-results.json` | **yes** |
| 10 | `cat-harness/test/results/tool-runs/lsi-index/cat-harness/skills.tool-run.json` | no |
| 10 | `cat-harness/test/results/subgraph-readmes.qa-results.json` | no |

**50 of the 60 most-churned paths are generated**, and the ten that are not
include four generated-with-markers READMEs the classifier's five-line window
missed. So the entry is not stale in the sense of being wrong — it is stale in
the sense of having been sized to a distribution that moved.

## The measured cost, on one branch

PR #1633, 2026-09-30: **22 merge cycles**. Conflicts across three consecutive
cycles, hand-recorded:

- cycle 20 — 12 conflicts, **11 generated**, 1 hand-authored (`WRITER_OVERRIDES`)
- cycle 21 — 7 conflicts, **7 generated**, 0 hand-authored
- cycle 22 — 6 conflicts, **6 generated**, 0 hand-authored

25 conflicts, 24 of them on files regenerated from the whole corpus anyway. The
single real one needed judgement (both sides had added distinct map entries and
the resolution was a union). That ratio is the argument: the mechanical
conflicts are not merely cheap to resolve, they are **crowding out attention**
from the one that was not.

## Candidates, each against `1swy`'s actual test

The test is NOT "is it generated" but **"does its producer carry anything
forward from the existing file"**. Checked by reading the producer, not by
pattern:

- **`cat-harness/test/results/skill-register.qa-results.json`** — written through
  `writeQaResult` (`scripts/qa-results.ts`). It DOES `readFileSync` the prior
  document, which looks disqualifying, and is not: the prior is used only as
  `key(prior) === key(result)` to skip a pointless write, and nothing from it
  reaches the output. Same category as `audit-coverage.qa-results.json`, already
  marked. **Passes.** Gated by `skill:register:check`.
- **`cat-harness/test/results/subgraph-readmes.qa-results.json`** — same writer.
  Passes if the same reading holds; VERIFY the producer individually rather than
  by family, which is the mistake this bean exists to avoid.
- **`cat-harness/test/results/lsi/.../skills.lsi.json`** and
  **`tool-runs/lsi-index/...`** — `scripts/lsi.ts` reads a sidecar at line 347.
  **NOT cleared.** Whether that read is its own output and whether anything is
  carried forward must be established before either is marked.
- **`beans/README.md`**, **`cat-harness/docs/_data/harness.json`**,
  **`docs/lsi/index.md`**, the subgraph READMEs — unexamined here.

## Done when

Each path proposed for `.gitattributes` has its producer READ and the
carry-forward question answered in writing, a CI gate named that would redden a
wrong resolution, and a case added to `scripts/tests/gitattributes.test.ts`.
A path that cannot clear all three stays out. **No glob over
`cat-harness/test/results/**`** — `kg-qa` sidecars carry attestations, and that
exclusion is the whole discipline of `1swy`.

## What this bean is NOT

Not a merge driver. `oxka` rejected `merge.*.driver` because it is per-checkout:
it would work in one clone and nowhere else, CI included. Unchanged.

Not the landing-race fix for #1633 either. A conflicted PR creates no
`pull_request` run at all (bean `52cz`), so fewer conflicts shortens each cycle
but does not by itself win the race against a base moving 10-25 commits per
cycle. The owner chose to keep cycling rather than enable a merge queue; this
reduces the cost of each cycle, not their number.
