---
# folio-assistant-tqoe
title: 'Migrate qou-specific content out of platform: q-usage, topic-keywords'
status: todo
type: task
created_at: 2026-08-07T10:07:23Z
updated_at: 2026-08-07T10:07:23Z
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
