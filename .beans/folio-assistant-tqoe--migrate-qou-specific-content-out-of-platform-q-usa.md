---
# folio-assistant-tqoe
title: 'Migrate qou-specific content out of platform: q-usage, topic-keywords'
status: completed
type: task
priority: normal
created_at: 2026-08-07T10:07:23Z
updated_at: 2026-08-07T10:17:10Z
---


## Problem

Content that belongs to one folio lives in the platform, so it is dead
weight for every other author and privileges qou.

1. **`Q_USAGE` criteria domain** (7 criteria,
   `qa-criteria-registry.ts`) — the substrate parameter `q`, its regimes
   (`q > 1`, root-of-unity, fixed `q_0`), the archimedean wall. This is
   qou's mathematics. Meanwhile qou's own `q-usage-watcher` skill was
   never migrated, so the criteria are in the platform and their watcher
   is in the content repo — exactly backwards.

2. **`DETANGLER_CHAPTER_KEYWORDS`** (`qa-checkers-extended.ts`, ~50
   lines) — keys are one folio's chapter directory names, values that
   folio's vocabulary. `detangler-topic-coherence` is therefore
   permanently `n/a` for every other folio (verified: 390 n/a / 10 pass
   on a 400-block qou sample, and those 10 only because the chapter
   names happen to match).

## Direction

Move both to folio-supplied data:
- `content/<paper>/topic-keywords.json` for the keyword profile, with
  qou's table shipped as an example rather than as platform code.
- Q_USAGE into a qou adapter (or a `folio-paper-adapter` optional
  criterion set gated on the folio declaring it), and move
  `q-usage-watcher` alongside it.

Not done unilaterally: deleting Q_USAGE would drop 7 live criteria from
the one folio using them, and that is the owner's call.

## Fixed

**Topic keywords** — extracted to folio-supplied data. A folio provides
`content/<paper>/topic-keywords.json` (`topic-keywords/v1`, merged across
papers); absent ⇒ `n/a`, the honest answer. qou's table ships as a sample
under `content/pipeline/topic-keywords/`, clearly labelled as an example
rather than platform behaviour. Verified both ways: with the profile
installed, 10 pass / 390 n/a on a 400-block qou sample (identical to the
old hardcoded behaviour); without it, 400 n/a.

**Q_USAGE** — now a folio-optional axis. `folioOptionalAxes()` reads
`qaAxes` from the folio's `folio.config.json`; the 7 criteria and the
`q-usage` watcher axis are registered only on opt-in. Fails closed: absent
or malformed config ⇒ no optional axes, since a folio that has not asked
for an axis should not be audited against it. Verified: 94 criteria
without, 101 with `{"qaAxes":["q-usage"]}`.

`q-usage-watcher` migrated from qou to `skills/folio-paper-adapter/`,
annotated with the opt-in requirement — the criteria and their watcher
now live together instead of straddling the two repos.
