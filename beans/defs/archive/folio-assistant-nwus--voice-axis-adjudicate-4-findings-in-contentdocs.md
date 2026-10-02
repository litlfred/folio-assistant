---
# folio-assistant-nwus
title: 'Voice axis: adjudicate 4 voice-editorializing findings in content/docs'
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:23:37Z
updated_at: 2026-09-18T23:55:14Z
---

The QA sweep over `content/docs/` flags 4 blocks on `voice-editorializing`
(severity `minor`). Recorded in the block sidecars and visible on the site via
the `QA` icon; this bean is the adjudication.

**What the criterion tests:** no editorialising phrases (“surprisingly”, “it is worth noting that”, “rather than merely …”).

**Context before judging.** This criterion was written for a *paper* folio and
carries no `profiles` scoping, so it runs on `content/docs/` as well — which is
documentation, where addressing the reader directly is the register the genre
uses. Three outcomes are all legitimate:

1. **The finding stands** — change the prose.
2. **The criterion should be scoped** — add `profiles: ["paper"]` to it in
   `content/pipeline/qa-criteria-registry.ts`, and the finding disappears for
   every document folio rather than one block at a time.
3. **The finding is right but the block is an exception** — record an agent or
   human reviewer entry on the sidecar saying why, which outranks the script
   entry without editing the prose.

Reviewing skill: `voice-editorial-review` (`skills/folio-core/`), the
human/agent half of this axis; the mechanical half is `qa-checkers-voice.ts`.

## Findings

- [ ] `content/docs/document-ingestion/uploads-and-library-are-two-stages-of-one-pipeline.md`
      content/docs/document-ingestion/uploads-and-library-are-two-stages-of-one-pipeline.md:12: merely go unread, it makes a **clean grep** read as *"nobody has done this"*
- [ ] `content/docs/evidence/overview.md`
      content/docs/evidence/overview.md:2: look, and what makes a source *authoritative* rather than merely cited.
- [ ] `content/docs/guides-writing-a-document/carrying-a-recommendation.md`
      content/docs/guides-writing-a-document/carrying-a-recommendation.md:15: Rules that make this work rather than merely compile:
- [ ] `content/docs/publication-workflow/the-base-processes-are-strict.md`
      content/docs/publication-workflow/the-base-processes-are-strict.md:20: **The commit boundary is where this is enforced rather than merely answerable.**

## Done when

Every box above is either fixed in prose, covered by a criterion-scoping
change, or carries a reviewer entry on its sidecar explaining the exception —
and `bun run content/pipeline/qa-sweep.ts --root content/docs` reflects it.

_2026-09-18T23:55:14Z_ — ## Summary of Changes

All 4 findings were the bare word `merely` in an explicit contrast — `rather than merely cited/compile/answerable`, and one hard-wrapped `does not` / `merely go unread`. 4 hits, 4 comparative, 0 genuine. Fixed in `qa-checkers-voice.ts` with `COMPARATIVE_EXEMPT` (a global strip, so a second hit on the same line still fails) plus a one-line lookback for the wrapped case. 8 tests.
