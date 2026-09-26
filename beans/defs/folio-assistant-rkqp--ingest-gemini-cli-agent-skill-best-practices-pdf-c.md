---
# folio-assistant-rkqp
title: Ingest Gemini-CLI agent-skill best-practices PDF + commit 4677175 as MODEL-SPECIFIC voices for skills
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T14:45:12Z
updated_at: 2026-09-21T21:46:40Z
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


---

## COORDINATION NOTE from another session, 2026-09-21 — read before you author

Not a claim on this bean, and no action asked for. This is the
`/coordinate` bean trigger firing: this item is `in-progress` and will CREATE
VOICES, and the layout it would have created them in has moved underneath it.
Written here rather than messaged because a sibling session cannot be reached
directly — `ListAgents` lists none and `SendMessage` is refused; a committed
bean is what arrives.

**Branch `claude/bean-8h42-layout`, PR #773 (draft, green), in flight.**

### 1. Voices moved, and `<instance>/voices/<id>.json` is the OLD path

Now `<instance>/skills/voices/<id>/voice.json`, beside an optional
`SKILL.md` — because a voice IS a skill. Four instances declare a `voices`
directory at `skills/voices/`: `who-style-guide` (3 voices),
`folio-assistant-sci` (1), `folio-assistant-core` (1), `agent-skills`
(declared, still empty — bean `26tu`).

A bare `folio-voice/v1` profile at `skills/voices/<id>.json` still loads:
`voiceFilesIn` reads both file shapes deliberately, so nothing you write in
the old FILE shape breaks. It is the DIRECTORY that moved.

### 2. `cat-harness` declares no voices, deliberately

The platform holding another instance's editorial rules was the defect
(bean `btuv`). A voice added under `cat-harness/voices/` is now orphaned by
the migration — **which already happened once**: main commit `9b60f366` put
`technical-writer` there, and it had to be relocated by hand during a merge,
with git's rename detection dropping it inside another voice's folder first.

### 3. Where a model-specific voice should GO is a judgement

Owner, 2026-09-21: *"voices should be associated to appropriate home
semantically/by judgement."* Recorded in `schemas/voice-skill.ts`, which until
then said "the instance that DERIVED the voice" — a mechanical rule the corpus
falsifies twice. `who-editorial` cites who-iris's library and lives in
who-style-guide; `technical-writer` cites RFCs ingested in `agent-skills` and
lives in `folio-assistant-core`. **Where the source sits has never decided
ownership.** So this bean's Gemini-CLI voice does not automatically belong
wherever the PDF is ingested.

`agent-skills` is the obvious candidate for model-specific voices — it already
declares the graph and its description names exactly this plan ("a shared base
plus one override per vendor") — but that is the owner's call, not mine.

### 4. Two checks now run over voices

- `check:voices` — every rule cites a source that RESOLVES, with a quote. A
  `kgRef` resolves against the voice's OWN instance unless it names one, so
  cross-instance citations need `instance: "<name>"`.
- `check:voice-skills` — the instruction body must not RESTATE the rules. It
  asks for a `SKILL.md` only when the voice PROMISES one, so a bare profile
  with no `instructions` is fine.

Both are in the gate set. If you author against `main` today, neither this
layout nor these gates exist there yet; they arrive when #773 merges.
