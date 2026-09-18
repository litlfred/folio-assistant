---
# folio-assistant-kitc
title: 'Voice axis: adjudicate 4 voice-emoji-content findings in content/docs'
status: todo
type: task
priority: normal
created_at: 2026-09-18T22:23:37Z
updated_at: 2026-09-18T22:23:57Z
---

The QA sweep over `content/docs/` flags 4 blocks on `voice-emoji-content`
(severity `major`). Recorded in the block sidecars and visible on the site via
the `QA` icon; this bean is the adjudication.

**What the criterion tests:** no emoji as content outside tables; in tables only ✓ / ✗ comparison markers.

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

- [ ] `content/docs/evidence/three-classes.md`
      content/docs/evidence/three-classes.md:7: > ⚠ **Known blind spot.** A document that was OCR'd but never re-run through
- [ ] `content/docs/guides-who-smart-ig/a-mock-session.md`
      content/docs/guides-who-smart-ig/a-mock-session.md:12: > conformance ✓, terminology bindings resolved ✓.
- [ ] `content/docs/guides-writing-a-paper/step-4-formalize-in-lean.md`
      content/docs/guides-writing-a-paper/step-4-formalize-in-lean.md:22: > **Assistant:** *(edits, 'lean_build')* ✅ Build green, **0 sorries**.
- [ ] `content/docs/guides-writing-a-paper/step-5-validate.md`
      content/docs/guides-writing-a-paper/step-5-validate.md:7: > 'def:' block has its required Lean link ✓, theorem has a proof block ✓, example | content/docs/guides-writing-a-paper/step-5-validate.md:8: > references a defined symbol ✓.

## Done when

Every box above is either fixed in prose, covered by a criterion-scoping
change, or carries a reviewer entry on its sidecar explaining the exception —
and `bun run content/pipeline/qa-sweep.ts --root content/docs` reflects it.
