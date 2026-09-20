---
# folio-assistant-sl1h
title: 'Voice axis: adjudicate 4 voice-status-leak findings in content/docs'
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:23:37Z
updated_at: 2026-09-18T23:55:14Z
---

The QA sweep over `content/docs/` flags 4 blocks on `voice-status-leak`
(severity `critical`). Recorded in the block sidecars and visible on the site via
the `QA` icon; this bean is the adjudication.

**What the criterion tests:** no status markers or derivation-status speech in body prose.

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

- [ ] `content/docs/crdm-methodology/what-is-not-built-yet.md`
      content/docs/crdm-methodology/what-is-not-built-yet.md:36: **Not yet implemented:**
- [ ] `content/docs/guides-writing-a-document/1-scaffold-the-folio.md`
      content/docs/guides-writing-a-document/1-scaffold-the-folio.md:26: The starter block is a placeholder that says so. Replace it.
- [ ] `content/docs/publication-workflow/how-to-read-them.md`
      content/docs/publication-workflow/how-to-read-them.md:7: - **The "Work plan — beans" lane** is the shared to-do store. Steps in that
- [ ] `content/docs/publication-workflow/the-work-plan-tasks-as-beans.md`
      content/docs/publication-workflow/the-work-plan-tasks-as-beans.md:19: branches. An agent's ephemeral in-memory to-do list is not.

## Done when

Every box above is either fixed in prose, covered by a criterion-scoping
change, or carries a reviewer entry on its sidecar explaining the exception —
and `bun run content/pipeline/qa-sweep.ts --root content/docs` reflects it.

_2026-09-18T23:55:14Z_ — ## Summary of Changes

All 4 resolved as agent `pass` with reasoning, not prose edits: each block's SUBJECT is a status inventory or a to-do store, so the criterion read a subject as an assertion. `what-is-not-built-yet.md` is titled for its gaps; `1-scaffold-the-folio.md` documents the placeholder `folio_init` writes; the two `publication-workflow` blocks describe the BPMN lane literally named 'Work plan — beans'.
