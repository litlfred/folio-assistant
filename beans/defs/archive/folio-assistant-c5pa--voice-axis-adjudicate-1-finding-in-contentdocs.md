---
# folio-assistant-c5pa
title: 'Voice axis: adjudicate 1 voice-first-person-work finding in content/docs'
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:23:37Z
updated_at: 2026-09-18T23:55:14Z
---

The QA sweep over `content/docs/` flags 1 block on `voice-first-person-work`
(severity `major`). Recorded in the block sidecars and visible on the site via
the `QA` icon; this bean is the adjudication.

**What the criterion tests:** no first-person work tone (“we’ll add”, “let me”, “needs more work”).

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

- [ ] `content/docs/agentic-harness/feature-request-workflow.md`
      content/docs/agentic-harness/feature-request-workflow.md:33: > folio-assistant itself. Before I build anything, let me help you work through | content/docs/agentic-harness/feature-request-workflow.md:34: > exactly what's needed so we get it right. I'll document the requirements on

## Done when

Every box above is either fixed in prose, covered by a criterion-scoping
change, or carries a reviewer entry on its sidecar explaining the exception —
and `bun run content/pipeline/qa-sweep.ts --root content/docs` reflects it.

_2026-09-18T23:55:14Z_ — ## Summary of Changes

Agent `pass`. The first person is inside a `>` quotation under the block's own heading '### What the user sees' — it is what the agent SAYS, not the author speaking. Surrounding prose is third person throughout.
