---
# folio-assistant-rkqp
title: Ingest Gemini-CLI agent-skill best-practices PDF + commit 4677175 as MODEL-SPECIFIC voices for skills
status: todo
type: task
priority: normal
created_at: 2026-09-20T14:45:12Z
updated_at: 2026-09-20T14:51:00Z
parent: folio-assistant-slw1
---


Owner, 2026-09-20, with an upload and a link:

> `Agent_Skill_best_practices___Gemini_CLI.pdf` one-voice source for skills
> <https://github.com/litlfred/folio-assistant/commit/467717508cf8ee3f8bb4cf1eaace91e769d92e16>
>
> for model specific sources, make those model specific voices. make sure .ts
> skill data model accomodates all. (preference leave unstructured schema,
> agentic review b/c of "best practice" drift, not formal).
> ingest the commit and attachement

## What this is

Two sources of **skill-authoring** guidance, to become **voices** — the same
object `check:voices` already audits prose against — rather than a new kind:

1. the uploaded PDF, which is **Gemini-CLI-specific**, and
2. commit `4677175` in this repository, which is ours.

## The decision the owner already made

**A model-specific source becomes a MODEL-SPECIFIC voice.** Not one merged
"skill authoring" voice with per-model caveats: Gemini CLI's advice is
evidence about Gemini CLI, and folding it into a single voice makes it
unfalsifiable which model a rule was measured on. This is the same
`ThemeRef`/inheritance shape settled earlier today — a shared default with
named overrides — and it is what lets a rule that turns out to be
Gemini-only be dropped without touching the rest.

## Explicitly NOT formal

Owner: *"preference leave unstructured schema, agentic review b/c of 'best
practice' drift, not formal"*. So:

- the `.ts` skill data model **accommodates** these sources without
  constraining their content — no enum of rule kinds, no required fields
  beyond provenance;
- conformance is an **agentic QA review**, not a schema gate. "Best practice"
  drifts; a formal check would pin whichever vintage was current when it was
  written and then report clean over the drift, which is the `dh4f` shape one
  level up.

## Done when

- [ ] The PDF is ingested with **extraction provenance** (`capturedAt`,
      `producer`, `readAt`) per `skills/folio-core/asset-extraction.md` —
      metadata by default, contents only on explicit ask, which this is.
- [ ] Commit `4677175` is ingested as a source with its sha pinned.
- [ ] The `.ts` skill data model carries both, with the model-specific ones
      attributable to their model.
- [ ] A Gemini-CLI voice and our own voice exist as SEPARATE voices, and
      `check:voices` sees both (it fans out over `instancesWithVoices`).
- [ ] The agentic QA review axis exists and is wired; NO formal gate on
      rule content.

## Related

Sits beside the documentation-voice work the owner asked for in the same
session: *"make that QA audit review (agentic) on the agentic memory content
types (agents.md etc.). need one voice to go with it as part of documentation
creation"*. Same mechanism, different subject — that one is about `AGENTS.md`
and agent memory, this one is about authoring skills.
