---
# folio-assistant-hbsh
title: 'Voice axis: adjudicate 10 voice-scholarly-default findings in content/docs'
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:23:37Z
updated_at: 2026-09-18T23:55:14Z
---

The QA sweep over `content/docs/` flags 10 blocks on `voice-scholarly-default`
(severity `major`). Recorded in the block sidecars and visible on the site via
the `QA` icon; this bean is the adjudication.

**What the criterion tests:** scholarly third-person voice by default; flags second-person address, lecturer-cadence openers, paper-past-tense narration.

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

- [ ] `content/docs/agentic-harness/consolidated-skill-references.md`
      content/docs/agentic-harness/consolidated-skill-references.md:21: consolidation, not a new authority. If you find a discrepancy, fix this page.
- [ ] `content/docs/agentic-harness/feature-request-workflow.md`
      content/docs/agentic-harness/feature-request-workflow.md:17: → Acknowledge, explain you will help work through requirements first, enter
- [ ] `content/docs/guides-who-smart-ig/prerequisites.md`
      content/docs/guides-who-smart-ig/prerequisites.md:3: locally you need:
- [ ] `content/docs/guides-writing-a-document/1-scaffold-the-folio.md`
      content/docs/guides-writing-a-document/1-scaffold-the-folio.md:19: Either way you get 'content/', 'uploads/', 'library/', the manifests for one
- [ ] `content/docs/guides-writing-a-document/moving-between-content-types.md`
      content/docs/guides-writing-a-document/moving-between-content-types.md:3: **document → paper** is a one-line change. You are adding toolchains, not
- [ ] `content/docs/guides-writing-a-document/the-kinds-you-may-use.md`
      content/docs/guides-writing-a-document/the-kinds-you-may-use.md:6: 'content_validate' — so the failure arrives while you are writing rather than | content/docs/guides-writing-a-document/the-kinds-you-may-use.md:7: when you try to publish.
- [ ] `content/docs/guides-writing-a-document/what-a-document-folio-is-lead.md`
      content/docs/guides-writing-a-document/what-a-document-folio-is-lead.md:11: > Lean lifecycle and the LaTeX renderer on top. If you find yourself wanting a
- [ ] `content/docs/guides-writing-a-paper/before-you-start.md`
      content/docs/guides-writing-a-paper/before-you-start.md:2: For papers you want 'bun', 'latexmk'/'texlive', and Lean ('elan').
- [ ] `content/docs/guides-writing-a-paper/step-6-render.md`
      content/docs/guides-writing-a-paper/step-6-render.md:10: You can set rendering preferences (engine, scope, math renderer) via the
- [ ] `content/docs/guides-writing-a-paper/the-end-to-end-workflow.md`
      content/docs/guides-writing-a-paper/the-end-to-end-workflow.md:4: you have seen the validation findings and accepted it. The

## Done when

Every box above is either fixed in prose, covered by a criterion-scoping
change, or carries a reviewer entry on its sidecar explaining the exception —
and `bun run content/pipeline/qa-sweep.ts --root content/docs` reflects it.

_2026-09-18T23:55:14Z_ — ## Summary of Changes

Scoped `voice-scholarly-default` to `profiles: ["paper"]`. Ten findings, ten guide/reference pages, zero writing defects — the skill's own worked example (`prerequisites.md:3` "locally you need:") among them. Registry comment records that `profiles` is the wrong AXIS for a rule that varies by genre within a profile, and that a document folio wanting scholarly register should re-enable it via a voice once #208/#210 lands. The edit was inert until `cv10`.
